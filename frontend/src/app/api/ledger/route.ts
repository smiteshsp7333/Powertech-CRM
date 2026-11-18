import { NextRequest, NextResponse } from 'next/server';
import { getCloudLedgerEntries, saveSingleCloudEntry, deleteSingleCloudEntry } from '../../../lib/ledger/cloudStore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const entries = await getCloudLedgerEntries();
    return NextResponse.json({ success: true, entries });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch cloud entries' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body.entry;

    if (!entry || !entry.companyId || !entry.date) {
      return NextResponse.json(
        { success: false, error: 'Invalid entry payload. Missing companyId or date.' },
        { status: 400 }
      );
    }

    const updated = await saveSingleCloudEntry(entry);
    return NextResponse.json({ success: true, entries: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save cloud entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId');
    const date = searchParams.get('date');

    if (!companyId || !date) {
      return NextResponse.json(
        { success: false, error: 'Missing companyId or date parameter' },
        { status: 400 }
      );
    }

    const updated = await deleteSingleCloudEntry(companyId, date);
    return NextResponse.json({ success: true, entries: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete entry' },
      { status: 500 }
    );
  }
}
