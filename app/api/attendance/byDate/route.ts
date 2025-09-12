import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const date = searchParams.get('date');
		const studentIdsParam = searchParams.get('studentIds');
		if (!date || !studentIdsParam) {
			return NextResponse.json({ message: 'Date and studentIds are required' }, { status: 400 });
		}
		const studentIds = studentIdsParam.split(',');
		const target = new Date(date);
		target.setUTCHours(0, 0, 0, 0);
		const end = new Date(target);
		end.setUTCHours(23, 59, 59, 999);
		const records = await prisma.attendance.findMany({
			where: { studentId: { in: studentIds }, date: { gte: target, lte: end } },
		});
		return NextResponse.json(records);
	} catch (error: any) {
		return NextResponse.json({ message: 'Failed to fetch attendance', error: String(error?.message ?? error) }, { status: 500 });
	}
} 