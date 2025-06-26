import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    const { archived } = body;
    if (typeof archived !== 'boolean') {
      return NextResponse.json({ message: 'archived field must be boolean' }, { status: 400 });
    }
    const updatedUser = await User.findByIdAndUpdate(id, { archived }, { new: true, select: '-password' });
    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: archived ? 'User archived' : 'User unarchived', user: updatedUser });
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update archive status', error }, { status: 500 });
  }
} 