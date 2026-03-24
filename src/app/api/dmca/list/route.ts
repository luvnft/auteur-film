import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const adminUserId = searchParams.get('adminUserId');

    if (!adminUserId) {
      return NextResponse.json({ error: 'Admin user ID required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Verify admin user
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id, is_admin')
      .eq('id', adminUserId)
      .single();

    if (adminError || !adminUser || !adminUser.is_admin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    // Build query
    let query = supabase
      .from('dmca_reports')
      .select(`
        *,
        content:content_id (
          id,
          title,
          thumbnail_url,
          creator_id,
          creator:creator_id (
            id,
            display_name,
            email,
            strike_count
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('DMCA list error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
