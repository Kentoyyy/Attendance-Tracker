import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { grade } = body as { grade?: number };

		if (!grade) {
			return NextResponse.json({ message: 'Grade is required' }, { status: 400 });
		}

		// Delete all students in this grade
		const deletedStudents = await prisma.student.deleteMany({
			where: {
				grade: grade
			}
		});

		// Log the reset action
		const userId = (session.user as any).id;
		await prisma.log.create({
			data: {
				userId,
				action: `Students Reset - Grade ${grade}`,
				entityType: 'Student',
				entityId: null,
				before: null as any,
				after: { grade, deletedCount: deletedStudents.count },
			}
		});

		return NextResponse.json({ 
			message: `Successfully reset ${deletedStudents.count} students from Grade ${grade}`,
			deletedCount: deletedStudents.count 
		}, { status: 200 });

	} catch (error: any) {
		console.error('Error resetting students:', error);
		return NextResponse.json({ 
			message: 'Failed to reset students', 
			error: String(error?.message ?? error) 
		}, { status: 500 });
	}
}
