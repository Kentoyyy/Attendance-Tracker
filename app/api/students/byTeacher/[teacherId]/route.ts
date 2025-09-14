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

    // First, try to get students created by this teacher from logs
    const creationLogs = await prisma.log.findMany({
      where: {
        userId: teacherId,
        action: {
          contains: 'Student Added'
        }
      },
      select: {
        after: true
      }
    });

    // Extract student IDs from logs
    const studentIdsFromLogs = creationLogs
      .map(log => log.after as any)
      .filter(after => after && after.id)
      .map(after => after.id);

    // Get students that this teacher has recorded attendance for
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
            createdAt: true,
          }
        }
      },
      distinct: ['studentId'], // Get unique students only
    });

    // Extract students from the attendance records
    const studentsFromAttendance = attendanceRecords.map(record => record.student);

    // Get students created by this teacher directly
    const studentsFromCreation = await prisma.student.findMany({
      where: {
        id: {
          in: studentIdsFromLogs
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        lrn: true,
        sex: true,
        grade: true,
        isActive: true,
        createdAt: true,
      }
    });

    // Combine both lists and remove duplicates
    const allStudents = [...studentsFromAttendance, ...studentsFromCreation];
    const uniqueStudents = allStudents.filter((student, index, self) => 
      index === self.findIndex(s => s.id === student.id)
    );

    // Sort students by grade, then by sex (males first), then by name
    const sortedStudents = uniqueStudents.sort((a, b) => {
      // First sort by grade
      if (a.grade !== b.grade) {
        return a.grade - b.grade;
      }
      // Then by sex (males first)
      if (a.sex !== b.sex) {
        return a.sex === 'Male' ? -1 : 1;
      }
      // Finally by name
      const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim();
      const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim();
      return nameA.localeCompare(nameB);
    });

    console.log(`Found ${sortedStudents.length} students for teacher ${teacherId}`);
    console.log('Students by grade:', sortedStudents.reduce((acc, student) => {
      acc[student.grade] = (acc[student.grade] || 0) + 1;
      return acc;
    }, {} as Record<number, number>));
    console.log('Students from attendance:', studentsFromAttendance.length);
    console.log('Students from creation logs:', studentsFromCreation.length);

    return NextResponse.json(sortedStudents);
  } catch (error: any) {
    console.error('Error fetching students by teacher:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch students', 
      error: String(error?.message ?? error) 
    }, { status: 500 });
  }
} 