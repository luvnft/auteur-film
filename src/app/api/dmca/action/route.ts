import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  sendTakedownNotification,
  sendStrikeWarning,
  sendAccountSuspensionNotice,
} from '@/lib/email/dmca';

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
    const { reportId, action, adminNotes, adminUserId } = body;

    if (!reportId || !action || !adminUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: reportId, action, adminUserId' },
        { status: 400 }
      );
    }

    const validActions = ['takedown', 'dismiss', 'reviewed'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
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

    // Get the report with content and creator info
    const { data: report, error: reportError } = await supabase
      .from('dmca_reports')
      .select(`
        *,
        content:content_id (
          id,
          title,
          creator_id,
          creator:creator_id (
            id,
            email,
            display_name,
            strike_count
          )
        )
      `)
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const content = report.content as any;
    const creator = content?.creator;

    // Update report status
    const newStatus = action === 'takedown' ? 'actioned' : action === 'dismiss' ? 'dismissed' : 'reviewed';

    const { error: updateError } = await supabase
      .from('dmca_reports')
      .update({
        status: newStatus,
        admin_notes: adminNotes || null,
        actioned_at: new Date().toISOString(),
        actioned_by: adminUserId,
      })
      .eq('id', reportId);

    if (updateError) {
      console.error('Error updating report:', updateError);
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    // If takedown action
    if (action === 'takedown' && content) {
      // Update content status
      await supabase
        .from('content')
        .update({ content_status: 'removed_dmca' })
        .eq('id', content.id);

      // Add strike to creator
      if (creator) {
        const newStrikeCount = (creator.strike_count || 0) + 1;

        // Insert strike record
        await supabase.from('user_strikes').insert({
          user_id: creator.id,
          content_id: content.id,
          dmca_report_id: reportId,
          reason: `DMCA takedown: ${report.reason}`,
          strike_number: newStrikeCount,
        });

        // The trigger will auto-increment strike_count and suspend if >= 3

        // Send appropriate email to creator
        if (creator.email) {
          if (newStrikeCount >= 3) {
            // Account suspension
            sendAccountSuspensionNotice({
              creatorEmail: creator.email,
              creatorName: creator.display_name || 'Creator',
              contentTitle: content.title,
            }).catch((err) => console.error('Failed to send suspension notice:', err));
          } else {
            // Strike warning
            sendStrikeWarning({
              creatorEmail: creator.email,
              creatorName: creator.display_name || 'Creator',
              contentTitle: content.title,
              strikeNumber: newStrikeCount,
              reason: report.reason,
            }).catch((err) => console.error('Failed to send strike warning:', err));
          }

          // Always send takedown notification
          sendTakedownNotification({
            creatorEmail: creator.email,
            creatorName: creator.display_name || 'Creator',
            contentTitle: content.title,
            reason: report.reason,
            reporterDescription: report.description,
          }).catch((err) => console.error('Failed to send takedown notification:', err));
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Report ${action === 'takedown' ? 'actioned (content removed)' : action === 'dismiss' ? 'dismissed' : 'marked as reviewed'}`,
    });
  } catch (error: any) {
    console.error('DMCA action error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
