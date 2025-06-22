import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import StudentModel from '@/app/models/Student';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  // Check if the user is an admin (assume role is stored in session.user as a custom property)
  if (
    !session ||
    !session.user ||
    (session.user as { role?: string }).role !== 'admin'
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    
    // Fetch all students and populate the 'createdBy' field with the teacher's name
    const allStudents = await StudentModel.find({})
      .populate({
        path: 'createdBy',
        select: 'name' // Only get the name of the teacher
      })
      .sort({ createdAt: -1 });
    
    return NextResponse.json(allStudents);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch all students', error: errorMessage }, { status: 500 });
  }
} 