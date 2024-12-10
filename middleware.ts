import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // CORS başlıklarını ayarla
    const response = NextResponse.next();
    
    // Tüm originlere izin ver (production'da daha spesifik olmalı)
    response.headers.set('Access-Control-Allow-Origin', '*');
    
    // Çerez ayarlarını yapılandır
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');

    // SameSite ve güvenlik başlıkları
    response.headers.set('Set-Cookie', 'path=/; SameSite=None; Secure');

    return response;
}

// Middleware'in hangi path'lerde çalışacağını belirt
export const config = {
    matcher: [
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}; 