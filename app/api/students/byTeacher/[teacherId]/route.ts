import { NextResponse } from 'next/server';

export async function GET() {
	return NextResponse.json({ message: 'Students API is being rebuilt for PostgreSQL.' }, { status: 501 });
} 