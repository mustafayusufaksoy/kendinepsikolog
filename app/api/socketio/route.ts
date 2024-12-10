import { NextResponse } from 'next/server';

interface SocketResponse {
    message: string;
    timestamp: number;
    status: 'connected' | 'disconnected';
}

interface WebSocketHandler {
    socket: SocketResponse;
    send: (data: unknown) => void;
}

export async function GET() {
    const res = NextResponse.json({
        message: 'Socket connection established',
        timestamp: Date.now(),
        status: 'connected'
    }) as NextResponse & WebSocketHandler;
    
    return res;
}

export const dynamic = 'force-dynamic'; 