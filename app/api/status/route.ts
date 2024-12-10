import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface ServerStatus {
    status: 'online' | 'offline' | 'error';
    responseTime?: number;
    error?: string;
}

async function checkServerStatus(url: string): Promise<ServerStatus> {
    const startTime = Date.now();
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'text/html' },
            cache: 'no-store',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;

        if (response.ok) {
            return {
                status: 'online',
                responseTime
            };
        } else {
            return {
                status: 'offline',
                responseTime,
                error: `HTTP ${response.status}: ${response.statusText}`
            };
        }
    } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return {
            status: 'offline',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

async function sendOfflineServerAlert(offlineServers: Array<{url: string, error?: string}>) {
    // E-posta transport yapılandırması
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    // E-posta içeriği oluşturma
    const mailContent = offlineServers.map(server => 
        `URL: ${server.url}\nHata: ${server.error || 'Bilinmeyen hata'}`
    ).join('\n\n');

    // E-posta gönderme
    await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: process.env.MAIL_TO,
        subject: 'Offline Sunucu Uyarısı',
        text: `Aşağıdaki sunucular offline durumda:\n\n${mailContent}`,
    });
}

export async function GET() {

    
    try {
        const defaultServers = [
            { url: 'http://213.210.20.204:3010/login', name: 'Server 3010' },
            { url: 'http://213.210.20.204:4000', name: 'Server 4000' },
            { url: 'https://dashboard.giteks.com.tr/login', name: 'Dashboard' }
        ];

        const statusChecks = await Promise.all(
            defaultServers.map(async (server) => {
                try {
                    const status = await checkServerStatus(server.url);
                    if (status.status === 'offline') {
                        await sendOfflineServerAlert([{ url: server.url, error: status.error }]);
                    }
                    return [server.url, {
                        ...status,
                        lastCheck: new Date().toISOString()
                    }];
                } catch (error) {
                    console.error(`Error checking server ${server.url}:`, error);
                    return [server.url, {
                        status: 'error',
                        error: 'Failed to check server status',
                        lastCheck: new Date().toISOString()
                    }];
                }
            })
        );

        const serverStatuses = Object.fromEntries(statusChecks);
        const response = NextResponse.json(serverStatuses);
        
        // Çerez ayarlarını güncelle
        response.headers.set('Set-Cookie', 'path=/; SameSite=None; Secure');
        
        return response;
    } catch (error) {
        console.error('Detailed error:', error);
        return NextResponse.json(
            { 
                error: 'Failed to check server statuses',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 