import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
	try {
		// Test basic database connection
		await prisma.$queryRawUnsafe("SELECT 1");
		
		// Test Student model access
		const studentCount = await prisma.student.count();
		
		// Test Grade model access
		const gradeCount = await prisma.grade.count();
		
		return NextResponse.json({ 
			ok: true, 
			studentCount,
			gradeCount,
			models: {
				student: 'accessible',
				grade: 'accessible'
			}
		});
	} catch (error: any) {
		console.error('Database health check failed:', error);
		return NextResponse.json({ 
			ok: false, 
			error: String(error?.message ?? error),
			code: error?.code,
			meta: error?.meta
		}, { status: 500 });
	}
}
