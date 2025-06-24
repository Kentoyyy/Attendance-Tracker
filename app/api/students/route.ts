import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import StudentModel from '@/app/models/Student';
import Log from '@/app/models/Log';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/lib/auth"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('--- GET /api/students CALLED ---');
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    console.log('API AUTH ERROR: No session or user found.');
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  console.log('Session user ID:', (session.user as { id?: string }).id);

  try {
    await connectToDatabase();
    console.log('Database connected.');
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    const archivedParam = searchParams.get('archived');
    console.log('Filtering for grade:', grade);

    const filter: any = {
      createdBy: (session.user as { id?: string }).id,
      archived: archivedParam === '1' ? true : false,
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
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await request.json();

    if (Array.isArray(body)) {
      // Bulk import
      const studentsToCreate = body.map(student => ({
        ...student,
        createdBy: (session.user as { id?: string }).id,
        archived: false,
      }));
      const createdStudents = await StudentModel.insertMany(studentsToCreate);
      // Log each creation
      for (const newStudent of createdStudents) {
        await Log.create({
          user: (session.user as { id?: string }).id,
          action: 'create_student',
          details: `Created student: ${newStudent.name} (ID: ${newStudent._id})`
        });
      }
      return NextResponse.json(createdStudents, { status: 201 });
    } else {
      // Single student
      const newStudent = await StudentModel.create({
        ...body,
        createdBy: (session.user as { id?: string }).id,
        archived: false,
      });
      await Log.create({
        user: (session.user as { id?: string }).id,
        action: 'create_student',
        details: `Created student: ${newStudent.name} (ID: ${newStudent._id})`
      });
      return NextResponse.json(newStudent, { status: 201 });
    }
  } catch (error) {
    console.error('Failed to create student:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to create student', error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ message: 'Student id is required' }, { status: 400 });
    }
    let archived = true;
    try {
      const body = await request.json();
      if (typeof body.archived === 'boolean') {
        archived = body.archived;
      }
    } catch {}
    const updated = await StudentModel.findOneAndUpdate(
      { _id: id, createdBy: (session.user as { id?: string }).id },
      { archived },
      { new: true }
    );
    if (!updated) {
      return NextResponse.json({ message: 'Student not found or not authorized' }, { status: 404 });
    }
    await Log.create({
      user: (session.user as { id?: string }).id,
      action: archived ? 'archive_student' : 'restore_student',
      details: `${archived ? 'Archived' : 'Restored'} student: ${updated.name} (ID: ${updated._id})`
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to archive/restore student:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to archive/restore student', error: errorMessage }, { status: 500 });
  }
}
