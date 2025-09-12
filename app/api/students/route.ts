import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}
	try {
		const { searchParams } = new URL(request.url);
		const gradeId = searchParams.get('gradeId');
		const sectionId = searchParams.get('sectionId');
		const isActiveParam = searchParams.get('active');

		const isActive = isActiveParam === null ? undefined : isActiveParam === '1';

		const students = await prisma.student.findMany({
			where: {
				isActive,
				enrollments: sectionId
					? { some: { sectionId } }
				: gradeId
					? { some: { section: { gradeId } } }
				: undefined,
			},
			include: {
				enrollments: { include: { section: { include: { grade: true } } } },
			},
			orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
		});
		return NextResponse.json(students);
	} catch (error: any) {
		return NextResponse.json({ message: 'Failed to fetch students', error: String(error?.message ?? error) }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user) {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}
	try {
		const body = await request.json();
		if (Array.isArray(body)) {
			const created = await prisma.$transaction(
				body.map((s: any) =>
					prisma.student.create({
						data: {
							firstName: s.firstName ?? s.name ?? 'Unknown',
							lastName: s.lastName ?? '',
							lrn: s.lrn ?? null,
							sex: s.gender ?? s.sex ?? null,
							isActive: true,
							enrollments: s.sectionId
								? { create: { sectionId: s.sectionId, schoolYear: s.schoolYear ?? '2025-2026' } }
								: undefined,
						},
					})
				)
			);
			return NextResponse.json(created, { status: 201 });
		}

		type StudentCreateBody = { firstName?: string; lastName?: string; name?: string; lrn?: string; sectionId?: string; schoolYear?: string };
		const s = body as StudentCreateBody;
		const created = await prisma.student.create({
			data: {
				firstName: s.firstName ?? s.name ?? 'Unknown',
				lastName: s.lastName ?? '',
				lrn: s.lrn ?? null,
				sex: (s as any).gender ?? (s as any).sex ?? null,
				isActive: true,
				enrollments: s.sectionId ? { create: { sectionId: s.sectionId, schoolYear: s.schoolYear ?? '2025-2026' } } : undefined,
			},
			include: { enrollments: true },
		});
		return NextResponse.json(created, { status: 201 });
	} catch (error: any) {
		return NextResponse.json({ message: 'Failed to create student', error: String(error?.message ?? error) }, { status: 500 });
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
			if (typeof body.active === 'boolean') isActive = body.active;
		} catch {}
		const updated = await prisma.student.update({ where: { id }, data: { isActive } });
		return NextResponse.json(updated);
	} catch (error: any) {
		return NextResponse.json({ message: 'Failed to update student', error: String(error?.message ?? error) }, { status: 500 });
	}
}
