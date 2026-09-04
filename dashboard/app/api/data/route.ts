import { NextResponse } from 'next/server';
import { getLatestSnapshot } from '../../../lib/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getLatestSnapshot();
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch store snapshot' },
      { status: 500 }
    );
  }
}
