import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// GET /api/grades - Get all grades
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const grades = await prisma.grade.findMany({
      where: { 
        isActive: true,
        teacherId: (session.user as any).id // Filter by current teacher
      },
      orderBy: { number: 'asc' },
      select: {
        id: true,
        name: true,
        number: true,
        isActive: true,
        createdAt: true
      }
    });

    return NextResponse.json(grades);
  } catch (error) {
    console.error('Error fetching grades:', error);
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    );
  }
}

// POST /api/grades - Create a new grade
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, number } = body;

    if (!name || !number) {
      return NextResponse.json(
        { error: 'Name and number are required' },
        { status: 400 }
      );
    }

    // Check if grade name or number already exists (only active grades for this teacher)
    const existingActiveGrade = await prisma.grade.findFirst({
      where: {
        isActive: true,
        teacherId: (session.user as any).id,
        OR: [
          { name: name.trim() },
          { number: parseInt(number) }
        ]
      }
    });

    if (existingActiveGrade) {
      return NextResponse.json(
        { error: 'Grade with this name or number already exists' },
        { status: 409 }
      );
    }

    // Check if there's an inactive grade with the same name/number to reactivate
    const existingInactiveGrade = await prisma.grade.findFirst({
      where: {
        isActive: false,
        teacherId: (session.user as any).id,
        OR: [
          { name: name.trim() },
          { number: parseInt(number) }
        ]
      }
    });

    let grade;
    if (existingInactiveGrade) {
      // Reactivate the existing grade
      grade = await prisma.grade.update({
        where: { id: existingInactiveGrade.id },
        data: {
          name: name.trim(),
          number: parseInt(number),
          isActive: true,
          teacherId: (session.user as any).id,
          updatedAt: new Date()
        },
        select: {
          id: true,
          name: true,
          number: true,
          isActive: true,
          createdAt: true
        }
      });
    } else {
      // Create a new grade
      grade = await prisma.grade.create({
        data: {
          name: name.trim(),
          number: parseInt(number),
          teacherId: (session.user as any).id
        },
        select: {
          id: true,
          name: true,
          number: true,
          isActive: true,
          createdAt: true
        }
      });
    }

    return NextResponse.json(grade, { status: 201 });
  } catch (error) {
    console.error('Error creating grade:', error);
    return NextResponse.json(
      { error: 'Failed to create grade' },
      { status: 500 }
    );
  }
}

// DELETE /api/grades - Delete a grade
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gradeId = searchParams.get('id');

    if (!gradeId) {
      return NextResponse.json(
        { error: 'Grade ID is required' },
        { status: 400 }
      );
    }

    // Check if grade has students
    // First get the grade number from the gradeId
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
      select: { number: true }
    });
    
    if (!grade) {
      return NextResponse.json(
        { error: 'Grade not found' },
        { status: 404 }
      );
    }
    
    const studentCount = await prisma.student.count({
      where: { grade: grade.number }
    });

    if (studentCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete grade with existing students' },
        { status: 409 }
      );
    }

    // Check if this is the last grade for this teacher
    const totalGrades = await prisma.grade.count({
      where: { 
        isActive: true,
        teacherId: (session.user as any).id
      }
    });

    if (totalGrades <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete the last grade' },
        { status: 409 }
      );
    }

    await prisma.grade.update({
      where: { id: gradeId },
      data: { isActive: false }
    });

    return NextResponse.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    console.error('Error deleting grade:', error);
    return NextResponse.json(
      { error: 'Failed to delete grade' },
      { status: 500 }
    );
  }
}