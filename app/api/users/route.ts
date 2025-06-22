import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import User from '@/app/models/User';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

// GET all users (or filter by role)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // Type assertion to allow access to 'role' property
  if (
    !session ||
    !session.user ||
    (session.user as { role?: string }).role !== 'admin'
  ) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    const filter: any = {};
    if (role) {
      filter.role = role;
    }
    
    // Admin can get all users, optionally filtered by role
    const users = await User.find(filter).sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch users', error }, { status: 500 });
  }
}

// POST a new user (create teacher)
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    // For now, allow admin to create. Later you could add a self-registration option.
    // Type assertion to allow access to 'role' property
    if (
        !session ||
        !session.user ||
        (session.user as { role?: string }).role !== 'admin'
    ) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await connectToDatabase();
        const body = await request.json();
        const { name, email, password, role } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'teacher', // Default to teacher if not specified
        });
        
        // Don't send the password back
        const userResponse = newUser.toObject();
        delete userResponse.password;

        return NextResponse.json(userResponse, { status: 201 });

    } catch (error) {
        if (error instanceof Error && error.name === 'ValidationError') {
             return NextResponse.json({ message: 'Validation Error', error: error.message }, { status: 400 });
        }
        return NextResponse.json({ message: 'Failed to create user', error }, { status: 500 });
    }
} 