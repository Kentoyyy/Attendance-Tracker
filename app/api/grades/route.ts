import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
	try {
		// Get distinct grades from students
		const gradeData = await prisma.student.findMany({
			select: { grade: true },
			distinct: ['grade'],
			where: { isActive: true },
			orderBy: { grade: 'asc' }
		});
		
		// Format as grade objects with sections (empty for now since you don't have sections)
		const grades = gradeData.map(item => ({
			id: item.grade,
			levelNumber: item.grade,
			name: `Grade ${item.grade}`,
			sections: [] // No sections in your current schema
		}));
		
		return NextResponse.json({ grades });
	} catch (error: any) {
		return NextResponse.json(
			{ message: 'Failed to fetch grades', error: String(error?.message ?? error) }, 
			{ status: 500 }
		);
	}
}

