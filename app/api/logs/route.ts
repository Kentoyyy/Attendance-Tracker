import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
	try {
		const logs = await prisma.log.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
		return NextResponse.json(logs);
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const { action, details } = await request.json();
		if (!action || !details) {
			return NextResponse.json({ error: 'Action and details are required' }, { status: 400 });
		}
		const newLog = await prisma.log.create({ data: { action, entityType: null, entityId: null, before: null as any, after: null as any } });
		return NextResponse.json(newLog, { status: 201 });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
	}
} 