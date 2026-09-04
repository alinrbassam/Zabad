import { NextRequest, NextResponse } from 'next/server';
import { saveSnapshot, StoreSnapshot } from '../../../lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const syncKeyHeader = req.headers.get('x-sync-key');
    const expectedKey = process.env.SYNC_SECRET_KEY || 'zabad-secret-key-2026';

    // Simple security key verification
    if (expectedKey && syncKeyHeader !== expectedKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid sync key' },
        { status: 401 }
      );
    }

    const payload = (await req.json()) as StoreSnapshot;
    if (!payload || !payload.today) {
      return NextResponse.json(
        { success: false, error: 'Bad Request: Invalid snapshot data' },
        { status: 400 }
      );
    }

    await saveSnapshot(payload);

    return NextResponse.json({
      success: true,
      message: 'Store snapshot updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
