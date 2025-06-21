import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import StudentModel from '@/app/models/Student';
import AttendanceModel from '@/app/models/Attendance';

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const id = req.nextUrl.pathname.split('/').pop(); // Get [id] from URL
    const body = await req.json();
    const { name, grade } = body;

    if (!name || !grade) {
      return NextResponse.json({ message: 'Name and grade are required' }, { status: 400 });
    }

    const updatedStudent = await StudentModel.findByIdAndUpdate(id, { name, grade }, { new: true });

    if (!updatedStudent) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json(updatedStudent);
  } catch (error) {
    console.error(`Failed to update student:`, error);
    return NextResponse.json({ message: 'Failed to update student', error }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const id = req.nextUrl.pathname.split('/').pop(); // Get [id] from URL

    // First, delete all attendance records for this student
    await AttendanceModel.deleteMany({ studentId: id });

    // Then, delete the student
    const deletedStudent = await StudentModel.findByIdAndDelete(id);

    if (!deletedStudent) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Student and their attendance records deleted successfully' });
  } catch (error) {
    console.error(`Failed to delete student:`, error);
    return NextResponse.json({ message: 'Failed to delete student', error }, { status: 500 });
  }
} 