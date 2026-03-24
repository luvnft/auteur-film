import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendDMCAReportConfirmation, sendDMCANotificationToAgent } from '@/lib/email/dmca';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(url, serviceKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, contentType, reporterEmail, reason, description, originalWorkUrl } = body;

    // Validate required fields
    if (!contentId || !reporterEmail || !reason || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: contentId, reporterEmail, reason, description' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reporterEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate reason
    const validReasons = ['copyright', 'publicity', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Verify content exists
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('id, title, creator_id')
      .eq('id', contentId)
      .single();

    if (contentError || !content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    // Create the DMCA report
    const { data: report, error: insertError } = await supabase
      .from('dmca_reports')
      .insert({
        content_id: contentId,
        content_type: contentType || 'film',
        reporter_email: reporterEmail,
        reason,
        description,
        original_work_url: originalWorkUrl || null,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating DMCA report:', insertError);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    // Send confirmation email to reporter (fire and forget)
    sendDMCAReportConfirmation({
      reporterEmail,
      contentTitle: content.title,
      reportId: report.id,
      reason,
    }).catch((err) => console.error('Failed to send reporter confirmation:', err));

    // Send notification to DMCA agent (fire and forget)
    sendDMCANotificationToAgent({
      reportId: report.id,
      contentTitle: content.title,
      contentId,
      reporterEmail,
      reason,
      description,
      originalWorkUrl,
    }).catch((err) => console.error('Failed to send agent notification:', err));

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully',
    });
  } catch (error: any) {
    console.error('DMCA report error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
