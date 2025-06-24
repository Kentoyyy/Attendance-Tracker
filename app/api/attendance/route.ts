import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Attendance from '@/app/models/Attendance';
import Student from '@/app/models/Student';
import Log from '@/app/models/Log';
import { format } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month'); // YYYY-MM
    const isExport = searchParams.get('export');

    if (isExport) {
      // Export all absences
      const absences = await Attendance.find({ isAbsent: true }).populate('studentId');
      const exportData = absences.map((record: any) => ({
        studentName: record.studentId?.name || '',
        grade: record.studentId?.grade || '',
        date: record.date,
        reason: record.reason || '',
      }));
      return NextResponse.json(exportData);
    }

    if (!studentId || !month) {
      return NextResponse.json({ message: 'studentId and month are required' }, { status: 400 });
    }

    const startDate = new Date(`${month}-01T00:00:00Z`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const records = await Attendance.find({
      studentId,
      date: { $gte: startDate, $lte: endDate },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    return NextResponse.json({ message: 'Failed to fetch attendance' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { studentId, date, isAbsent, reason } = body;

    if (!studentId || !date) {
      return NextResponse.json({ message: 'studentId and date are required' }, { status: 400 });
    }

    const parsedDate = new Date(date);

    const record = await Attendance.findOneAndUpdate(
      { studentId, date: parsedDate },
      { studentId, date: parsedDate, isAbsent, reason },
      { new: true, upsert: true }
    );

    // Log the action
    const student = await Student.findById(studentId);
    if (student) {
      const action = isAbsent ? 'Student Marked Absent' : 'Absence Removed';
      const formattedDate = format(parsedDate, 'MMMM d, yyyy');
      const reasonText = reason ? ` with reason: "${reason}"` : '';
      const details = `${student.name} was marked ${isAbsent ? 'absent' : 'present'} on ${formattedDate}${reasonText}.`;
      await Log.create({ action, details, grade: student.grade });
    }

    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    console.error('Failed to update attendance:', error);
    return NextResponse.json({ message: 'Failed to update attendance' }, { status: 500 });
  }
}
