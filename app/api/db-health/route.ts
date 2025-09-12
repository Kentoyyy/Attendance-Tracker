import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
	try {
		await prisma.$queryRawUnsafe("SELECT 1");
		return NextResponse.json({ ok: true });
	} catch (error: any) {
		return NextResponse.json({ ok: false, error: String(error?.message ?? error) }, { status: 500 });
	}
}
