import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

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
		const { newPassword } = body as { newPassword?: string };
		if (!newPassword || newPassword.length < 6) {
			return NextResponse.json({ message: 'New password is required and must be at least 6 characters long' }, { status: 400 });
		}
		const hashed = await bcrypt.hash(newPassword, 10);
		const updated = await prisma.user.update({ where: { id }, data: { password: hashed } });
		if (!updated) return NextResponse.json({ message: 'User not found' }, { status: 404 });
		return NextResponse.json({ message: 'Password updated successfully', user: { id: updated.id, name: updated.name } });
	} catch (error) {
		return NextResponse.json({ message: 'Failed to change password', error: String((error as any)?.message ?? error) }, { status: 500 });
	}
} 