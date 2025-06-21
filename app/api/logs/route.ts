import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/mongodb';
import Log from '@/app/models/Log';

export async function GET() {
  await connectToDatabase();
  try {
    const logs = await Log.find({}).sort({ timestamp: -1 });
    return NextResponse.json(logs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  await connectToDatabase();
  try {
    const { action, details } = await request.json();
    if (!action || !details) {
      return NextResponse.json({ error: 'Action and details are required' }, { status: 400 });
    }
    const newLog = new Log({ action, details });
    await newLog.save();
    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
} 