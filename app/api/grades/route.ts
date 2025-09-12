import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
	const grades = await prisma.grade.findMany({
		orderBy: { levelNumber: "asc" },
		include: { sections: { orderBy: { name: "asc" } } },
	});
	return NextResponse.json({ grades });
}

