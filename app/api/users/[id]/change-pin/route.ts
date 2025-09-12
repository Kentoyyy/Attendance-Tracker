import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user || (session.user as { role?: string }).role !== 'admin') {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { id } = await params;
		const body = await request.json();
		const { newPin } = body as { newPin?: string };
		if (!newPin || !/^[0-9]{6}$/.test(newPin)) {
			return NextResponse.json({ message: 'New PIN is required and must be exactly 6 digits' }, { status: 400 });
		}

		const user = await prisma.user.findUnique({ where: { id } });
		if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 });
		if (user.role !== 'TEACHER') return NextResponse.json({ message: 'This endpoint is only for teachers' }, { status: 400 });

		const updated = await prisma.user.update({ where: { id }, data: { pin: newPin } });
		return NextResponse.json({ message: 'Teacher PIN updated successfully', user: { id: updated.id, name: updated.name } });
	} catch (error) {
		return NextResponse.json({ message: 'Failed to change teacher PIN', error: String((error as any)?.message ?? error) }, { status: 500 });
	}
}

