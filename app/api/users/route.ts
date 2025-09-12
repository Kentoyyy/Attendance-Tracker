import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';

// GET all users (or filter by role)
export async function GET(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user || (session.user as { role?: string }).role !== 'admin') {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const roleParam = searchParams.get('role');
		const roleFilter = roleParam ? roleParam.toUpperCase() : undefined;
		const users = await prisma.user.findMany({ where: roleFilter ? { role: roleFilter as any } : {}, orderBy: { createdAt: 'desc' } });
		return NextResponse.json(users);
	} catch (error) {
		return NextResponse.json({ message: 'Failed to fetch users', error }, { status: 500 });
	}
}

// POST a new user (create teacher or admin)
export async function POST(request: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user || (session.user as { role?: string }).role !== 'admin') {
		return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, email, password, pin, role } = body as { name?: string; email?: string; password?: string; pin?: string; role?: 'teacher' | 'admin' };

		if (role === 'teacher') {
			if (!name || !pin || !email) {
				return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
			}
			const existing = await prisma.user.findFirst({ where: { name, role: 'TEACHER' } });
			if (existing) {
				return NextResponse.json({ message: 'Teacher with this name already exists' }, { status: 409 });
			}
			const hashedPin = await bcrypt.hash(pin, 10);
			const newUser = await prisma.user.create({ data: { name, email, pin: hashedPin, role: 'TEACHER' } });

			// Log teacher creation
			const adminUserId = (session.user as any).id;
			await prisma.log.create({
				data: {
					userId: adminUserId,
					action: `Teacher Account Created - ${newUser.name}`,
					entityType: 'User',
					entityId: newUser.id,
					before: null,
					after: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
				}
			});

			return NextResponse.json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }, { status: 201 });
		} else if (role === 'admin') {
			if (!name || !email || !password) {
				return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
			}
			const existing = await prisma.user.findUnique({ where: { email } });
			if (existing) {
				return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
			}
			const hashedPassword = await bcrypt.hash(password, 10);
			const newUser = await prisma.user.create({ data: { name, email, password: hashedPassword, role: 'ADMIN' } });
			return NextResponse.json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }, { status: 201 });
		}
		return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
	} catch (error: any) {
		return NextResponse.json({ message: 'Failed to create user', error: error?.message ?? String(error) }, { status: 500 });
	}
} 