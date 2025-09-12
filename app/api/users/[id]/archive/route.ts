import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';
import prisma from '@/app/lib/prisma';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id } = await params;
    const body = await request.json();
    const { archived } = body;
    if (typeof archived !== 'boolean') {
      return NextResponse.json({ message: 'archived field must be boolean' }, { status: 400 });
    }
    
    // Use isActive field (inverse of archived) for PostgreSQL
    const isActive = !archived;
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true }
    });
    
    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    // Log the archive action
    const userId = (session.user as any).id;
    await prisma.log.create({
      data: {
        userId,
        action: archived ? `User Archived - ${updatedUser.name}` : `User Unarchived - ${updatedUser.name}`,
        entityType: 'User',
        entityId: updatedUser.id,
        before: null as any,
        after: { id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, isActive: updatedUser.isActive },
      }
    });
    
    return NextResponse.json({ 
      message: archived ? 'User archived' : 'User unarchived', 
      user: updatedUser 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      message: 'Failed to update archive status', 
      error: String(error?.message ?? error) 
    }, { status: 500 });
  }
} 