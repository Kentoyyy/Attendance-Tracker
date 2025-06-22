import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Attendance from '@/app/models/Attendance';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const studentIdsParam = searchParams.get('studentIds');

    if (!date || !studentIdsParam) {
      return NextResponse.json({ message: 'Date and studentIds are required' }, { status: 400 });
    }

    const studentIds = studentIdsParam.split(',');
    
    // The date comes in as 'yyyy-MM-dd'. We need to query for the entire day.
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      studentId: { $in: studentIds },
      date: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString(),
      },
    });

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: 'Failed to fetch attendance', error: errorMessage }, { status: 500 });
  }
} 