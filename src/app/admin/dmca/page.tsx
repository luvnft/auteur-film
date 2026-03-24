'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/components/providers/SoundProvider';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Eye,
  Trash2,
  FileText,
  User,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import type { DMCAReport, DMCAReportStatus } from '@/types/database';

const STATUS_COLORS: Record<DMCAReportStatus, { bg: string; text: string }> = {
  pending: { bg: '#FFE66D', text: '#1a1a1a' },
  reviewed: { bg: '#4ECDC4', text: '#1a1a1a' },
  actioned: { bg: '#FF6B6B', text: 'white' },
  dismissed: { bg: '#666', text: 'white' },
};

const STATUS_ICONS: Record<DMCAReportStatus, React.ElementType> = {
  pending: Clock,
  reviewed: Eye,
  actioned: CheckCircle,
  dismissed: XCircle,
};

type ExtendedDMCAReport = DMCAReport & {
  content?: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    creator_id: string;
    creator?: {
      id: string;
      display_name: string | null;
      email: string | null;
      strike_count: number;
    };
  };
};

export default function AdminDMCAPage() {
  const { user, isAuthenticated } = useUser();
  const { playClick, playSuccess, playError } = useSound();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<DMCAReportStatus | 'all'>('pending');
  const [selectedReport, setSelectedReport] = useState<ExtendedDMCAReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch reports
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['dmca-reports', statusFilter, user?.id],
    queryFn: async () => {
      if (!user?.id) return { reports: [] };
      const params = new URLSearchParams({
        status: statusFilter,
        adminUserId: user.id,
      });
      const res = await fetch(`/api/dmca/list?${params}`);
      if (!res.ok) throw new Error('Failed to fetch reports');
      return res.json();
    },
    enabled: !!user?.id,
  });

  // Action mutation
  const actionMutation = useMutation({
    mutationFn: async ({ reportId, action }: { reportId: string; action: string }) => {
      const res = await fetch('/api/dmca/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          action,
          adminNotes,
          adminUserId: user?.id,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }
      return res.json();
    },
    onSuccess: () => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['dmca-reports'] });
      setSelectedReport(null);
      setAdminNotes('');
    },
    onError: () => {
      playError();
    },
  });

  const reports = (reportsData?.reports || []) as ExtendedDMCAReport[];

  // Check admin access
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Header />
        <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto text-center">
          <div className="card-retro-static p-8 bg-white">
            <AlertTriangle className="h-12 w-12 text-[#FF6B6B] mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-[#666]">Please sign in to access the admin dashboard.</p>
          </div>
        </main>
      </div>
    );
  }

  // Note: In production, you'd verify is_admin from the database
  // For now, we'll show the UI but the API will enforce admin checks

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-[#FF6B6B] border-3 border-[#1a1a1a] shadow-[3px_3px_0_#1a1a1a] flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-[var(--font-pixel)] tracking-wider">
                DMCA QUEUE
              </h1>
              <div className="h-1 w-20 bg-[#4ECDC4] mt-1" />
            </div>
          </div>
          <Link href="/dmca" target="_blank">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View Policy
            </Button>
          </Link>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['pending', 'reviewed', 'actioned', 'dismissed', 'all'] as const).map((status) => {
            const Icon = status === 'all' ? Eye : STATUS_ICONS[status as DMCAReportStatus];
            return (
              <button
                key={status}
                onClick={() => {
                  playClick();
                  setStatusFilter(status);
                }}
                className={`flex items-center gap-2 px-4 py-2 border-3 border-[#1a1a1a] font-bold uppercase text-sm tracking-wide transition-all ${
                  statusFilter === status
                    ? 'bg-[#1a1a1a] text-white shadow-[4px_4px_0_#666]'
                    : 'bg-white hover:bg-[#FFF8F0]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {status}
              </button>
            );
          })}
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="card-retro-static p-8 bg-white text-center">
            <div className="h-8 w-8 border-4 border-[#FF6B6B] border-t-transparent mx-auto animate-spin" style={{ animationTimingFunction: 'steps(8)' }} />
            <p className="mt-4 text-[#666]">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="card-retro-static p-8 bg-white text-center">
            <CheckCircle className="h-12 w-12 text-[#4ECDC4] mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">No Reports</h2>
            <p className="text-[#666]">
              {statusFilter === 'pending'
                ? 'No pending reports to review.'
                : `No ${statusFilter} reports found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const StatusIcon = STATUS_ICONS[report.status];
              const colors = STATUS_COLORS[report.status];

              return (
                <div
                  key={report.id}
                  className="card-retro-static p-4 bg-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1a1a1a] transition-all cursor-pointer"
                  onClick={() => {
                    playClick();
                    setSelectedReport(report);
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-16 bg-[#E8E0D8] border-2 border-[#1a1a1a] flex-shrink-0 overflow-hidden">
                      {report.content?.thumbnail_url ? (
                        <img
                          src={report.content.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#666]">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-[#1a1a1a] truncate">
                            {report.content?.title || 'Unknown Content'}
                          </h3>
                          <p className="text-sm text-[#666]">
                            by {report.content?.creator?.display_name || 'Unknown Creator'}
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-1 px-2 py-1 border-2 border-[#1a1a1a] text-xs font-bold uppercase"
                          style={{ background: colors.bg, color: colors.text }}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {report.status}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-[#666]">
                          <Mail className="h-4 w-4" />
                          {report.reporter_email}
                        </span>
                        <span className="font-bold text-[#FF6B6B]">{report.reason}</span>
                        <span className="text-[#999]">
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b-3 border-[#1a1a1a] bg-[#FF6B6B]">
                <h2 className="font-bold text-white uppercase tracking-wide">Report Details</h2>
                <button
                  onClick={() => {
                    playClick();
                    setSelectedReport(null);
                    setAdminNotes('');
                  }}
                  className="h-8 w-8 bg-white border-2 border-[#1a1a1a] flex items-center justify-center hover:bg-[#FFE66D]"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                {/* Content Info */}
                <div className="flex gap-4 p-3 bg-[#FFF8F0] border-2 border-[#1a1a1a]">
                  <div className="w-20 h-14 bg-[#E8E0D8] border-2 border-[#1a1a1a] flex-shrink-0 overflow-hidden">
                    {selectedReport.content?.thumbnail_url && (
                      <img
                        src={selectedReport.content.thumbnail_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-bold">{selectedReport.content?.title}</p>
                    <p className="text-sm text-[#666]">
                      by {selectedReport.content?.creator?.display_name}
                    </p>
                    <Link
                      href={`/content/${selectedReport.content_id}`}
                      target="_blank"
                      className="text-sm text-[#FF6B6B] hover:underline flex items-center gap-1"
                    >
                      View Content <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* Creator Strike Info */}
                {selectedReport.content?.creator && (
                  <div className="p-3 bg-[#FFE66D]/20 border-2 border-[#FFE66D]">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-bold">Creator Status:</span>
                      <span>
                        {selectedReport.content.creator.strike_count || 0} strike(s)
                      </span>
                    </div>
                    {(selectedReport.content.creator.strike_count || 0) >= 2 && (
                      <p className="text-sm text-[#FF6B6B] font-bold mt-1">
                        ⚠️ Warning: Another strike will suspend this account
                      </p>
                    )}
                  </div>
                )}

                {/* Report Details */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-bold text-[#666]">Reporter</p>
                    <p>{selectedReport.reporter_email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#666]">Reason</p>
                    <p className="font-bold text-[#FF6B6B]">{selectedReport.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#666]">Description</p>
                    <p className="p-3 bg-[#FFF8F0] border-2 border-[#E8E0D8]">
                      {selectedReport.description}
                    </p>
                  </div>
                  {selectedReport.original_work_url && (
                    <div>
                      <p className="text-sm font-bold text-[#666]">Original Work URL</p>
                      <a
                        href={selectedReport.original_work_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#FF6B6B] hover:underline break-all"
                      >
                        {selectedReport.original_work_url}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-[#666]">Submitted</p>
                    <p>{new Date(selectedReport.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Admin Notes */}
                {selectedReport.status === 'pending' && (
                  <div>
                    <label className="block text-sm font-bold mb-2">Admin Notes</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about your decision..."
                      className="input-retro w-full px-4 py-3 min-h-[80px] resize-none"
                    />
                  </div>
                )}

                {/* Actions */}
                {selectedReport.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t-2 border-[#E8E0D8]">
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={() => actionMutation.mutate({ reportId: selectedReport.id, action: 'takedown' })}
                      isLoading={actionMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Takedown Content
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => actionMutation.mutate({ reportId: selectedReport.id, action: 'dismiss' })}
                      isLoading={actionMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Dismiss
                    </Button>
                  </div>
                )}

                {/* Show previous action info */}
                {selectedReport.status !== 'pending' && selectedReport.admin_notes && (
                  <div className="p-3 bg-[#E8E0D8] border-2 border-[#1a1a1a]">
                    <p className="text-sm font-bold text-[#666]">Admin Notes</p>
                    <p>{selectedReport.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
