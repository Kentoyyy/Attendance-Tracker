import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // Check if the user is an admin
  if (
    !session ||
    !session.user ||
    (session.user as { role?: string }).role !== 'admin'
  ) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const { newPassword } = body;

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ 
        message: 'New password is required and must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true, select: '-password' } // Don't return the password
    );

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Password updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Failed to change password:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ 
      message: 'Failed to change password', 
      error: errorMessage 
    }, { status: 500 });
  }
} 