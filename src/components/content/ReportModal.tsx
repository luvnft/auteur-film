'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { useSound } from '@/components/providers/SoundProvider';
import { AlertTriangle, X, Flag, CheckCircle, ExternalLink } from 'lucide-react';
import type { Content, DMCAReportReason } from '@/types/database';
import Link from 'next/link';

type ReportStep = 'reason' | 'details' | 'confirm' | 'success';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: Content;
  userEmail?: string | null;
}

const REPORT_REASONS: { value: DMCAReportReason; label: string; description: string }[] = [
  {
    value: 'copyright',
    label: 'Copyright Infringement',
    description: 'This content uses copyrighted material without permission',
  },
  {
    value: 'publicity',
    label: 'Right of Publicity Violation',
    description: 'Unauthorized use of someone\'s name, image, or likeness',
  },
  {
    value: 'other',
    label: 'Other Violation',
    description: 'Other legal or policy violation',
  },
];

export function ReportModal({ isOpen, onClose, content, userEmail }: ReportModalProps) {
  const [step, setStep] = useState<ReportStep>('reason');
  const [reason, setReason] = useState<DMCAReportReason | null>(null);
  const [email, setEmail] = useState(userEmail || '');
  const [description, setDescription] = useState('');
  const [originalWorkUrl, setOriginalWorkUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { playClick, playSuccess, playError } = useSound();

  const submitReport = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/dmca/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: content.id,
          contentType: content.type,
          reporterEmail: email,
          reason,
          description,
          originalWorkUrl: originalWorkUrl || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit report');
      }

      return response.json();
    },
    onSuccess: () => {
      playSuccess();
      setStep('success');
    },
    onError: (err: Error) => {
      playError();
      setError(err.message);
      setStep('details');
    },
  });

  const handleClose = () => {
    setStep('reason');
    setReason(null);
    setEmail(userEmail || '');
    setDescription('');
    setOriginalWorkUrl('');
    setError(null);
    onClose();
  };

  const handleReasonSelect = (selectedReason: DMCAReportReason) => {
    playClick();
    setReason(selectedReason);
    setStep('details');
  };

  const handleSubmit = () => {
    if (!email || !description || !reason) {
      setError('Please fill in all required fields');
      return;
    }

    playClick();
    setStep('confirm');
  };

  const handleConfirm = () => {
    playClick();
    submitReport.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-[#1a1a1a] shadow-[8px_8px_0_#1a1a1a] w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-3 border-[#1a1a1a] bg-[#FF6B6B]">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-white" />
            <h2 className="font-bold text-white uppercase tracking-wide">Report Content</h2>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 bg-white border-2 border-[#1a1a1a] flex items-center justify-center hover:bg-[#FFE66D] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content being reported */}
        <div className="p-4 bg-[#FFF8F0] border-b-3 border-[#1a1a1a]">
          <p className="text-sm text-[#666] font-medium">Reporting:</p>
          <p className="font-bold text-[#1a1a1a] truncate">{content.title}</p>
        </div>

        {/* Step: Select Reason */}
        {step === 'reason' && (
          <div className="p-4 space-y-3">
            <p className="text-sm text-[#666] font-medium mb-4">
              Why are you reporting this content?
            </p>
            {REPORT_REASONS.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => handleReasonSelect(value)}
                className="w-full text-left p-4 border-3 border-[#1a1a1a] bg-white hover:bg-[#FFE66D] hover:shadow-[4px_4px_0_#1a1a1a] transition-all"
              >
                <p className="font-bold text-[#1a1a1a]">{label}</p>
                <p className="text-sm text-[#666] mt-1">{description}</p>
              </button>
            ))}
            <div className="pt-4 border-t-2 border-[#E8E0D8]">
              <Link
                href="/dmca"
                target="_blank"
                className="text-sm text-[#FF6B6B] hover:underline font-bold flex items-center gap-1"
              >
                Read our DMCA Policy
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === 'details' && (
          <div className="p-4 space-y-4">
            <button
              onClick={() => {
                playClick();
                setStep('reason');
              }}
              className="text-sm text-[#666] hover:text-[#1a1a1a] font-medium"
            >
              ← Back to reason selection
            </button>

            <div className="p-3 bg-[#FFF8F0] border-2 border-[#1a1a1a]">
              <p className="text-sm font-bold">
                {REPORT_REASONS.find((r) => r.value === reason)?.label}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-[#FF6B6B]/10 border-2 border-[#FF6B6B] text-[#FF6B6B] text-sm font-bold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold mb-2">
                Your Email <span className="text-[#FF6B6B]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-retro w-full px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">
                Description <span className="text-[#FF6B6B]">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the violation in detail..."
                className="input-retro w-full px-4 py-3 min-h-[100px] resize-none"
                required
              />
            </div>

            {reason === 'copyright' && (
              <div>
                <label className="block text-sm font-bold mb-2">
                  URL of Original Work
                </label>
                <input
                  type="url"
                  value={originalWorkUrl}
                  onChange={(e) => setOriginalWorkUrl(e.target.value)}
                  placeholder="https://..."
                  className="input-retro w-full px-4 py-3"
                />
                <p className="text-xs text-[#666] mt-1">
                  Link to the original copyrighted work (if available online)
                </p>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full"
              onClick={handleSubmit}
              disabled={!email || !description}
            >
              Continue
            </Button>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="p-4 space-y-4">
            <div className="p-4 bg-[#FFE66D]/20 border-3 border-[#FFE66D]">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-[#1a1a1a] flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold text-[#1a1a1a] mb-1">Important Notice</p>
                  <p className="text-[#666]">
                    By submitting this report, you confirm that you have a good faith belief that
                    the reported content violates the rights you've described. Knowingly submitting
                    false reports may result in legal liability.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Reason:</span>
                <span className="font-bold">
                  {REPORT_REASONS.find((r) => r.value === reason)?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#666]">Email:</span>
                <span className="font-bold">{email}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  playClick();
                  setStep('details');
                }}
              >
                Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirm}
                isLoading={submitReport.isPending}
              >
                Submit Report
              </Button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="p-6 text-center">
            <div className="h-16 w-16 bg-[#4ECDC4] border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Report Submitted</h3>
            <p className="text-[#666] text-sm mb-6">
              Thank you for your report. Our team will review it and take appropriate action.
              You'll receive a confirmation email at {email}.
            </p>
            <Button variant="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
