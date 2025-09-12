import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();
		const { firstName, lastName, lrn } = body as { firstName?: string; lastName?: string; lrn?: string };
		const updated = await prisma.student.update({ where: { id }, data: { firstName, lastName, lrn } });
		return NextResponse.json(updated);
	} catch (error) {
		return NextResponse.json({ message: 'Failed to update student', error }, { status: 500 });
	}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		await prisma.attendance.deleteMany({ where: { studentId: id } });
		await prisma.enrollment.deleteMany({ where: { studentId: id } });
		await prisma.student.delete({ where: { id } });
		return NextResponse.json({ message: 'Student and their attendance records deleted successfully' });
	} catch (error) {
		return NextResponse.json({ message: 'Failed to delete student', error }, { status: 500 });
	}
} 