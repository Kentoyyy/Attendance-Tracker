import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const studentId = searchParams.get('studentId');
		const month = searchParams.get('month'); // YYYY-MM
		const isExport = searchParams.get('export');

		if (isExport) {
			const absences = await prisma.attendance.findMany({ where: { status: 'ABSENT' }, include: { student: true } });
			const exportData = absences.map((r: { studentId: any; studentName: any; date: any; status: any; }) => ({
				studentId: r.studentId,
				studentName: r.studentName,
				date: r.date,
				status: r.status,
			}));
			return NextResponse.json(exportData);
		}

		if (!studentId || !month) {
			return NextResponse.json({ message: 'studentId and month are required' }, { status: 400 });
		}
		const startDate = new Date(`${month}-01T00:00:00Z`);
		const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
		const records = await prisma.attendance.findMany({
			where: { studentId, date: { gte: startDate, lte: endDate } },
			orderBy: { date: 'asc' },
		});
		return NextResponse.json(records);
	} catch (error: any) {
		return NextResponse.json({ message: 'Failed to fetch attendance', error: String(error?.message ?? error) }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || !session.user) {
			return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
		}
		const userId = (session.user as any).id as string;

		const body = await req.json();
		const { studentId, date, status, reason, sectionId } = body as { studentId: string; date: string; status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'; reason?: string; sectionId?: string };
		if (!studentId || !date) {
			return NextResponse.json({ message: 'studentId and date are required' }, { status: 400 });
		}

		const student = await prisma.student.findUnique({ where: { id: studentId }, select: { firstName: true, lastName: true, sex: true } });
		const studentName = student ? `${student.firstName ?? ''}${student.lastName ? ' ' + student.lastName : ''}` : '';
		const studentGender = student?.sex || null;
		const parsedDate = new Date(date);
		const upserted = await prisma.attendance.upsert({
			where: { studentId_date: { studentId, date: parsedDate } },
			update: { 
				status: status ?? 'PRESENT', 
				sectionIdSnapshot: sectionId ?? '',
				studentName: studentName
			},
			create: { 
				studentId, 
				date: parsedDate, 
				status: status ?? 'PRESENT', 
				sectionIdSnapshot: sectionId ?? '', 
				recordedByUserId: userId,
				studentName: studentName
			},
		});
		if (reason) {
			await prisma.absenceNote.upsert({
				where: { attendanceId: upserted.id },
				update: { note: reason, studentName: studentName },
				create: { attendanceId: upserted.id, note: reason, studentName: studentName },
			});
		}

		// Log action with student name
		await prisma.log.create({
			data: {
				userId,
				action: status === 'ABSENT' ? `Student Marked Absent - ${studentName}` : `Attendance Updated - ${studentName}`,
				entityType: 'Attendance',
				entityId: upserted.id,
				before: null as any,
				after: { studentId, studentName, date: parsedDate, status: status ?? 'PRESENT', reason: reason ?? null, sex: studentGender },
			}
		});
		return NextResponse.json(upserted, { status: 200 });
	} catch (error: any) {
		return NextResponse.json({ message: 'Failed to update attendance', error: String(error?.message ?? error) }, { status: 500 });
	}
}
