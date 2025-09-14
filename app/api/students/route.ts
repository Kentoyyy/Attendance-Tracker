import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}
	try {
		const { searchParams } = new URL(request.url);
		const grade = searchParams.get('grade');
		const isActiveParam = searchParams.get('active');
		const archived = searchParams.get('archived');

		const isActive = isActiveParam === null ? undefined : isActiveParam === '1';
		const isArchived = archived === '1';

		const students = await prisma.student.findMany({
			where: {
				isActive: isArchived ? false : (isActive ?? true),
				grade: grade ? parseInt(grade) : undefined,
				teacherId: (session.user as any).id, // Filter by current teacher
			} as any,
			orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
		});
		console.log(`Found ${students.length} students for grade ${grade}`);
		return NextResponse.json(students);
	} catch (error: any) {
		return NextResponse.json({ message: 'Failed to fetch students', error: String(error?.message ?? error) }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user) {
		console.log('POST /api/students - Unauthorized');
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}
	try {
		const body = await request.json();
		console.log('POST /api/students - Request body:', body);
		if (Array.isArray(body)) {
			const created = await prisma.$transaction(
				body.map((s: any) => {
					// Handle name field - split if it's a full name
					let firstName = s.firstName ?? 'Unknown';
					let lastName = s.lastName ?? '';
					
					if (s.name && !s.firstName && !s.lastName) {
						const nameParts = s.name.trim().split(' ');
						firstName = nameParts[0] || 'Unknown';
						lastName = nameParts.slice(1).join(' ') || '';
					}
					
					return prisma.student.create({
						data: {
							firstName,
							lastName,
							lrn: s.lrn ?? null,
							sex: s.sex ?? null,
							grade: s.grade ?? 1, // Default to grade 1
							isActive: true,
							teacherId: (session.user as any).id, // Associate with current teacher
						} as any,
					});
				})
			);

			// Log bulk student creation
			const userId = (session.user as any).id;
			await prisma.log.create({
				data: {
					userId,
					action: `Bulk Student Creation - ${created.length} students added`,
					entityType: 'Student',
					entityId: null,
					before: null as any,
					after: { count: created.length, students: created.map((s: { id: any; firstName: any; lastName: any; sex: any; }) => ({ id: s.id, name: `${s.firstName} ${s.lastName}`, sex: s.sex })) },
				}
			});

			return NextResponse.json(created, { status: 201 });
		}

		type StudentCreateBody = { firstName?: string; lastName?: string; name?: string; lrn?: string; grade?: number; sex?: string };
		const s = body as StudentCreateBody;
		
		// Handle name field - split if it's a full name
		let firstName = s.firstName ?? 'Unknown';
		let lastName = s.lastName ?? '';
		
		if (s.name && !s.firstName && !s.lastName) {
			const nameParts = s.name.trim().split(' ');
			firstName = nameParts[0] || 'Unknown';
			lastName = nameParts.slice(1).join(' ') || '';
		}
		
		const created = await prisma.student.create({
			data: {
				firstName,
				lastName,
				lrn: s.lrn ?? null,
				sex: s.sex ?? null,
				grade: s.grade ?? 1, // Default to grade 1
				isActive: true,
				teacherId: (session.user as any).id, // Associate with current teacher
			} as any,
		});

		// Log single student creation
		const userId = (session.user as any).id;
		await prisma.log.create({
			data: {
				userId,
				action: `Student Added - ${created.firstName} ${created.lastName}`,
				entityType: 'Student',
				entityId: created.id,
				before: null as any,
				after: { id: created.id, name: `${created.firstName} ${created.lastName}`, lrn: created.lrn, grade: created.grade, sex: created.sex },
			}
		});

		console.log('POST /api/students - Student created successfully:', created);
		return NextResponse.json(created, { status: 201 });
	} catch (error: any) {
		console.error('POST /api/students - Error creating student:', error);
		console.error('Error details:', {
			message: error?.message,
			code: error?.code,
			meta: error?.meta,
			stack: error?.stack
		});
		return NextResponse.json({ 
			message: 'Failed to create student', 
			error: String(error?.message ?? error),
			details: error?.code || 'Unknown error'
		}, { status: 500 });
	}
}

export async function PATCH(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get('id');
		if (!id) return NextResponse.json({ message: 'Student id is required' }, { status: 400 });
		
		let isActive = true;
		try {
			const body = await request.json();
			// Handle both 'active' and 'archived' fields for backward compatibility
			if (typeof body.active === 'boolean') {
				isActive = body.active;
			} else if (typeof body.archived === 'boolean') {
				isActive = !body.archived; // archived = true means isActive = false
			}
		} catch {}
		
		const updated = await prisma.student.update({ where: { id }, data: { isActive } });
		
		// Log the archive/unarchive action
		const userId = (session.user as any).id;
		await prisma.log.create({
			data: {
				userId,
				action: isActive ? `Student Unarchived - ${updated.firstName} ${updated.lastName}` : `Student Archived - ${updated.firstName} ${updated.lastName}`,
				entityType: 'Student',
				entityId: updated.id,
				before: null as any,
				after: { id: updated.id, name: `${updated.firstName} ${updated.lastName}`, isActive: updated.isActive },
			}
		});
		
		return NextResponse.json(updated);
	} catch (error: any) {
		return NextResponse.json({ message: 'Failed to update student', error: String(error?.message ?? error) }, { status: 500 });
	}
}
