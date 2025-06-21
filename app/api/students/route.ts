import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import StudentModel from '@/app/models/Student';
import Log from '@/app/models/Log';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');

    if (!grade) {
      return NextResponse.json({ message: 'Grade query parameter is required' }, { status: 400 });
    }

    const students = await StudentModel.find({ grade: parseInt(grade, 10) }).sort({ gender: -1, name: 1 });
    return NextResponse.json(students);
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json({ message: 'Failed to fetch students', error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, grade, gender } = body;

    if (!name || !grade || !gender) {
      return NextResponse.json({ message: 'Name, grade, and gender are required' }, { status: 400 });
    }

    const newStudent = new StudentModel({ name, grade, gender });
    await newStudent.save();

    // Log the action
    const logDetails = `New student "${name}" (${gender}) was added to Grade ${grade}.`;
    await Log.create({ action: 'Student Added', details: logDetails, grade: grade });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error('Failed to create student:', error);
    return NextResponse.json({ message: 'Failed to create student', error }, { status: 500 });
  }
}
