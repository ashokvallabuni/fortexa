import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checkedAt = new Date().toISOString();
  try { const { error } = await (await createClient()).from('organizations').select('id').limit(1); if (error) return NextResponse.json({ status: 'error', database: 'disconnected', checkedAt }, { status: 503, headers: { 'cache-control': 'no-store' } }); return NextResponse.json({ status: 'ok', database: 'connected', checkedAt }, { headers: { 'cache-control': 'no-store' } }); }
  catch (error) { console.error('Health check failed:', error); return NextResponse.json({ status: 'error', database: 'unconfigured', checkedAt }, { status: 503, headers: { 'cache-control': 'no-store' } }); }
}