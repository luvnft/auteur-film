'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/components/providers/SoundProvider';
import { createClient } from '@/lib/supabase/client';
import { User, Camera, ArrowLeft, Zap, Shield, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSpendPermission } from '@/hooks/useSpendPermission';
import { EnableQuickTips } from '@/components/payments/EnableQuickTips';
import { QUICK_TIP_MAX_AMOUNT, QUICK_TIP_PERIOD_DAYS } from '@/lib/constants';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUser();
  const { playClick, playSuccess, playError } = useSound();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEnableQuickTips, setShowEnableQuickTips] = useState(false);

  // Quick Tips
  const { hasQuickTips, isCheckingPermission, revokePermission, isRequesting } = useSpendPermission();

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setAvatarUrl(user.avatar_url);
    }
  }, [user]);

  // Handle avatar selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      playError();
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      playError();
      setError('Image must be less than 5MB');
      return;
    }

    playClick();
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError(null);
  };

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user?.id || !supabase) throw new Error('Not authenticated');

      let newAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        newAvatarUrl = publicUrl;
      }

      // Validate username format (alphanumeric and underscores only)
      const cleanUsername = username.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');

      if (username && cleanUsername !== username.trim().toUpperCase()) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }

      // Check if username is taken (if changed)
      if (cleanUsername && cleanUsername !== user.username?.toUpperCase()) {
        const { data: existingUsers } = await supabase
          .from('users')
          .select('id')
          .eq('username', cleanUsername)
          .neq('id', user.id);

        if (existingUsers && existingUsers.length > 0) {
          throw new Error('Username is already taken');
        }
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          display_name: displayName.trim() || null,
          username: cleanUsername || null,
          bio: bio.trim() || null,
          avatar_url: newAvatarUrl,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      playSuccess();
      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/profile');
    },
    onError: (err: Error) => {
      playError();
      setError(err.message);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Header />
        <div className="pt-20 flex items-center justify-center h-[60vh]">
          <div className="h-16 w-16 border-4 border-[#FF6B6B] border-t-transparent animate-spin" style={{ animationTimingFunction: 'steps(8)' }} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#FFF8F0]">
        <Header />
        <div className="pt-20 max-w-xl mx-auto px-4 py-20 text-center">
          <div className="card-retro-static inline-flex items-center justify-center h-20 w-20 mb-6 bg-[#FFE66D]">
            <User className="h-10 w-10 text-[#1a1a1a]" />
          </div>
          <h1 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-4">SIGN IN REQUIRED</h1>
          <p className="text-[#666] mb-8 font-medium">
            Sign in to edit your profile.
          </p>
          <Link href="/">
            <Button variant="primary">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentAvatar = avatarPreview || avatarUrl;

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <Header />

      <main className="pt-24 pb-12 px-4 max-w-md mx-auto">
        {/* Back link */}
        <Link
          href="/profile"
          onClick={playClick}
          className="inline-flex items-center text-sm text-[#FF6B6B] font-bold hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Profile
        </Link>

        <h1 className="text-2xl font-[var(--font-pixel)] tracking-wider mb-2">EDIT PROFILE</h1>
        <div className="h-1 w-20 bg-[#4ECDC4] mb-8" />

        {/* Avatar */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="h-32 w-32 bg-[#FF6B6B] border-4 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] flex items-center justify-center overflow-hidden">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-16 w-16 text-white" />
              )}
            </div>
            <button
              onClick={() => {
                playClick();
                fileInputRef.current?.click();
              }}
              className="absolute -bottom-2 -right-2 h-10 w-10 bg-[#FFE66D] border-3 border-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] flex items-center justify-center hover:shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
            >
              <Camera className="h-5 w-5 text-[#1a1a1a]" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="text-sm text-[#666] mt-4 font-medium">
            Click camera to change photo
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              className="input-retro w-full"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] font-bold">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                placeholder="USERNAME"
                maxLength={20}
                className="input-retro w-full pl-10 uppercase"
              />
            </div>
            <p className="text-xs text-[#666] mt-1 font-medium">
              Letters, numbers, and underscores only
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wide mb-2">
              Bio <span className="text-[#666] font-normal">(Optional)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={200}
              className="input-retro w-full resize-none"
            />
            <p className="text-xs text-[#666] mt-1 font-medium text-right">
              {bio.length}/200
            </p>
          </div>

          {/* Quick Tips Section */}
          <div className="pt-4 border-t-4 border-dashed border-[#E8E0D8]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-[#FFE66D] border-2 border-[#1a1a1a] flex items-center justify-center">
                  <Zap className="h-4 w-4 text-[#1a1a1a]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">QUICK TIPS</h3>
                  <p className="text-xs text-[#666]">One-tap tipping, no confirmations</p>
                </div>
              </div>
              {isCheckingPermission ? (
                <div className="h-5 w-16 bg-[#E8E0D8] animate-pulse" />
              ) : hasQuickTips ? (
                <span className="px-3 py-1 bg-[#4ECDC4] border-2 border-[#1a1a1a] text-xs font-bold text-white">
                  ENABLED
                </span>
              ) : (
                <span className="px-3 py-1 bg-[#E8E0D8] border-2 border-[#1a1a1a] text-xs font-bold text-[#666]">
                  DISABLED
                </span>
              )}
            </div>

            <div className="bg-[#FFF8F0] border-3 border-[#1a1a1a] p-4 mb-4">
              {hasQuickTips ? (
                <>
                  <div className="flex items-start gap-2 mb-3">
                    <Shield className="h-4 w-4 text-[#4ECDC4] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[#666]">
                      Quick Tips is active. Tips up to <span className="font-bold">${QUICK_TIP_MAX_AMOUNT}</span> will be sent instantly without wallet confirmations.
                      Permission expires in <span className="font-bold">{QUICK_TIP_PERIOD_DAYS} days</span>.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      playClick();
                      revokePermission.mutate();
                    }}
                    isLoading={revokePermission.isPending}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Disable Quick Tips
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-[#666] mb-3">
                    Enable Quick Tips to tip creators instantly with one click.
                    Max ${QUICK_TIP_MAX_AMOUNT} per tip, revoke anytime.
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      playClick();
                      setShowEnableQuickTips(true);
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Enable Quick Tips
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#FF6B6B]/10 border-3 border-[#FF6B6B] text-[#FF6B6B] p-4 text-sm font-bold">
              {error}
            </div>
          )}

          {/* Save Button */}
          <Button
            size="lg"
            variant="primary"
            className="w-full"
            onClick={() => updateProfile.mutate()}
            isLoading={updateProfile.isPending}
          >
            Save Changes
          </Button>
        </div>
      </main>

      {/* Enable Quick Tips Modal */}
      <EnableQuickTips
        isOpen={showEnableQuickTips}
        onClose={() => setShowEnableQuickTips(false)}
        onEnabled={() => {
          playSuccess();
          setShowEnableQuickTips(false);
        }}
        onSkip={() => setShowEnableQuickTips(false)}
      />
    </div>
  );
}
