import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import StudentModel from '@/app/models/Student';
import Log from '@/app/models/Log';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('--- GET /api/students CALLED ---');
  const session = await getServerSession(authOptions);
  
  if (!session) {
    console.log('API AUTH ERROR: No session found.');
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  console.log('Session user ID:', session.user.id);

  try {
    await connectToDatabase();
    console.log('Database connected.');
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    console.log('Filtering for grade:', grade);

    const filter: any = {
      createdBy: session.user.id
    };

    if (grade) {
      filter.grade = parseInt(grade, 10);
    }
    
    console.log('Executing find with filter:', filter);
    const students = await StudentModel.find(filter).sort({ name: 1 });
    console.log('Students found in DB:', students.length, students);
    
    return NextResponse.json(students);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('API FETCH ERROR:', errorMessage);
    return NextResponse.json({ message: 'Failed to fetch students', error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await request.json();
    
    const newStudent = await StudentModel.create({
      ...body,
      createdBy: session.user.id,
    });
    
    await Log.create({
      user: session.user.id,
      action: 'create_student',
      details: `Created student: ${newStudent.name} (ID: ${newStudent._id})`
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error('Failed to create student:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to create student', error: errorMessage }, { status: 500 });
  }
}
