/**
 * Finance Strategy API (Proxy)
 * 
 * POST /api/finance-strategy
 *   → forwards request to Python backend /api/generate
 *   → returns exactly the JSON produced by the Python backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiBase } from '@/lib/api';
import { auth } from '@/auth';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Check authentication
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { error: 'Unauthorized. Please sign in to continue.' },
      { status: 401 }
    );
  }

  try {
    const payload = await request.json();
    
    // Automatically inject user_id from session if not provided
    if (!payload.user_id) {
      payload.user_id = session.user.id;
    }

    const base = getApiBase();
    const backendUrl = `${base}/api/generate`;

    console.log(`📨 Proxying finance-strategy request to backend: ${backendUrl}`);

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json() : await res.text();

    const duration = Date.now() - startTime;
    console.log(`✅ Backend responded in ${duration}ms with status ${res.status}`);

    if (!res.ok) {
      // Forward backend error as-is (wrapped in JSON if needed)
      if (isJson) {
        return NextResponse.json(body, { status: res.status });
      }
      return NextResponse.json({ error: String(body) }, { status: res.status });
    }

    // Success – return exactly what the Python backend returned
    return NextResponse.json(body, { status: res.status });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('❌ Error proxying to backend /api/generate:', error);

    return NextResponse.json(
      {
        error: 'Failed to reach FinIQ backend service',
        detail: error?.message || 'Unknown error',
        processingTime: duration,
      },
      { status: 500 },
    );
  }
}

// Simple health check for this proxy route
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'finance-strategy-proxy',
    timestamp: new Date().toISOString(),
  });
}

