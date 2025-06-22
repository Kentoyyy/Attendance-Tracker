import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import StudentModel from '@/app/models/Student';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ teacherId: string }> }) {
  const session = await getServerSession(authOptions);

  // Check if the user is an admin (assume role is stored in session.user as a custom property)
  if (
    !session ||
    !session.user ||
    (session.user as { role?: string }).role !== 'admin'
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { teacherId } = await params;

  if (!teacherId) {
    return NextResponse.json({ message: "Teacher ID is required" }, { status: 400 });
  }

  try {
    await connectToDatabase();
    
    const students = await StudentModel.find({ createdBy: teacherId }).sort({ grade: 1, name: 1 });
    
    return NextResponse.json(students);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch students for teacher', error: errorMessage }, { status: 500 });
  }
} 