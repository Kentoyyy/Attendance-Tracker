import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user || (session.user as { role?: string }).role !== 'admin') {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}
	try {
		const { id } = await params;
		if (!id) return NextResponse.json({ message: 'User id is required' }, { status: 400 });
		// Clean up relations (attendance records)
		await prisma.attendance.updateMany({ where: { recordedByUserId: id }, data: { recordedByUserId: id } });
		await prisma.log.deleteMany({ where: { userId: id } });
		await prisma.user.delete({ where: { id } });
		return NextResponse.json({ message: 'User deleted successfully' });
	} catch (error) {
		return NextResponse.json({ message: 'Failed to delete user', error }, { status: 500 });
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user || (session.user as { role?: string }).role !== 'admin') {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}
	try {
		const { id } = await params;
		if (!id) return NextResponse.json({ message: 'User id is required' }, { status: 400 });
		const body = await request.json();
		const { name, email } = body as { name?: string; email?: string };
		const updated = await prisma.user.update({ where: { id }, data: { name, email } });
		return NextResponse.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role });
	} catch (error) {
		return NextResponse.json({ message: 'Failed to update user', error }, { status: 500 });
	}
} 