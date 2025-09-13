import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teacherId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { teacherId } = await params;

    // Find students by getting unique students from attendance records recorded by this teacher
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        recordedByUserId: teacherId,
      },
      select: {
        studentId: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            lrn: true,
            sex: true,
            grade: true,
            isActive: true,
          }
        }
      },
      distinct: ['studentId'], // Get unique students only
      orderBy: {
        student: {
          lastName: 'asc'
        }
      }
    });

    // Extract students from the attendance records
    const students = attendanceRecords.map(record => record.student);

    return NextResponse.json(students);
  } catch (error: any) {
    console.error('Error fetching students by teacher:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch students', 
      error: String(error?.message ?? error) 
    }, { status: 500 });
  }
} 