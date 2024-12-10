import { NextResponse } from 'next/server';
import { connectDB } from '../../../src/lib/database';

export async function GET() {
    try {
        await connectDB();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error }, { status: 500 });
    }
} 