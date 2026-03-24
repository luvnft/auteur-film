'use client';

import Link from 'next/link';
import { useConnect, useAccount } from 'wagmi';
import { useUser } from '@/hooks/useUser';
import { useSound } from '@/components/providers/SoundProvider';
import { Button, IconButton } from '@/components/ui/Button';
import { Film, User, LogOut, Plus, Menu, X, Wallet, Volume2, VolumeX, Sparkles, BookOpen } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { connectors, connect, isPending } = useConnect();
  const { isConnected } = useAccount();
  const { user, isAuthenticated, isLoading, isCreator, logout } = useUser();
  const { isSoundEnabled, toggleSound, playClick } = useSound();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get the Coinbase Wallet connector
  const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK');

  const handleConnect = () => {
    if (coinbaseConnector) {
      connect({ connector: coinbaseConnector });
    }
  };

  const handleNavClick = () => {
    playClick();
  };

  const ready = !isPending;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFF8F0] border-b-4 border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
            onClick={handleNavClick}
          >
            <div className="relative">
              <Film className="h-8 w-8 text-[#FF6B6B] group-hover:animate-wiggle" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-[#FFE66D] animate-pulse" />
            </div>
            <span className="text-xl font-bold font-[var(--font-pixel)] tracking-wider text-[#1a1a1a]">
              AUTEUR
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/browse"
              onClick={handleNavClick}
              className="px-4 py-2 text-[#1a1a1a] font-bold uppercase tracking-wide text-sm hover:bg-[#4ECDC4] hover:text-[#1a1a1a] border-3 border-transparent hover:border-[#1a1a1a] transition-all hover:shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]"
            >
              Browse
            </Link>
            {isAuthenticated && (
              <Link
                href="/library"
                onClick={handleNavClick}
                className="px-4 py-2 text-[#1a1a1a] font-bold uppercase tracking-wide text-sm hover:bg-[#FFE66D] hover:text-[#1a1a1a] border-3 border-transparent hover:border-[#1a1a1a] transition-all hover:shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                Library
              </Link>
            )}
            {isCreator && (
              <Link
                href="/publish"
                onClick={handleNavClick}
                className="px-4 py-2 text-[#1a1a1a] font-bold uppercase tracking-wide text-sm hover:bg-[#9B5DE5] hover:text-white border-3 border-transparent hover:border-[#1a1a1a] transition-all hover:shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px]"
              >
                Publish
              </Link>
            )}
          </nav>

          {/* Desktop Auth & Controls */}
          <div className="hidden md:flex items-center gap-3">
            {/* Sound toggle */}
            <IconButton
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              title={isSoundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {isSoundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </IconButton>

            {!ready || isLoading ? (
              <div className="h-10 w-24 bg-[#E8E0D8] border-3 border-[#1a1a1a] animate-pulse" />
            ) : isAuthenticated ? (
              <>
                {isCreator && (
                  <Link href="/publish">
                    <Button variant="accent" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Publish
                    </Button>
                  </Link>
                )}
                <div className="relative group">
                  <button
                    onClick={handleNavClick}
                    className="flex items-center gap-2 p-2 border-3 border-[#1a1a1a] bg-white hover:bg-[#FFF1E6] shadow-[3px_3px_0_#1a1a1a] hover:shadow-[4px_4px_0_#1a1a1a] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.display_name || 'Profile'}
                        className="h-8 w-8 border-2 border-[#1a1a1a] object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-[#FF6B6B] flex items-center justify-center border-2 border-[#1a1a1a]">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-bold max-w-[100px] truncate">
                      {user?.display_name || 'Profile'}
                    </span>
                  </button>

                  {/* Dropdown */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border-3 border-[#1a1a1a] shadow-[4px_4px_0_#1a1a1a] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <Link
                      href="/profile"
                      onClick={handleNavClick}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-[#4ECDC4] transition-colors border-b-2 border-[#E8E0D8]"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      href="/library"
                      onClick={handleNavClick}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-[#FFE66D] transition-colors border-b-2 border-[#E8E0D8]"
                    >
                      <BookOpen className="h-4 w-4" />
                      My Library
                    </Link>
                    <Link
                      href="/wallet"
                      onClick={handleNavClick}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-[#9B5DE5] hover:text-white transition-colors border-b-2 border-[#E8E0D8]"
                    >
                      <Wallet className="h-4 w-4" />
                      Wallet
                    </Link>
                    {!isCreator && (
                      <Link
                        href="/become-creator"
                        onClick={handleNavClick}
                        className="flex items-center gap-2 px-4 py-3 text-sm font-bold hover:bg-[#9B5DE5] hover:text-white transition-colors border-b-2 border-[#E8E0D8]"
                      >
                        <Film className="h-4 w-4" />
                        Become Creator
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        playClick();
                        logout();
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-[#FF6B6B] hover:bg-[#FF6B6B] hover:text-white transition-colors w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Log Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Button onClick={handleConnect} variant="primary" disabled={isPending}>
                {isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={toggleSound}
            >
              {isSoundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </IconButton>
            <IconButton
              variant="outline"
              onClick={() => {
                playClick();
                setMobileMenuOpen(!mobileMenuOpen);
              }}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </IconButton>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t-4 border-[#1a1a1a]">
          <nav className="flex flex-col p-4 gap-2">
            <Link
              href="/browse"
              className="px-4 py-3 font-bold uppercase tracking-wide border-3 border-[#1a1a1a] bg-[#4ECDC4] shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#1a1a1a] transition-all"
              onClick={() => {
                playClick();
                setMobileMenuOpen(false);
              }}
            >
              Browse
            </Link>
            {isAuthenticated && (
              <Link
                href="/library"
                className="px-4 py-3 font-bold uppercase tracking-wide border-3 border-[#1a1a1a] bg-[#FFE66D] shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#1a1a1a] transition-all"
                onClick={() => {
                  playClick();
                  setMobileMenuOpen(false);
                }}
              >
                My Library
              </Link>
            )}
            {isCreator && (
              <>
                <Link
                  href="/publish"
                  className="px-4 py-3 font-bold uppercase tracking-wide border-3 border-[#1a1a1a] bg-[#FFE66D] shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#1a1a1a] transition-all"
                  onClick={() => {
                    playClick();
                    setMobileMenuOpen(false);
                  }}
                >
                  Publish Content
                </Link>
              </>
            )}
            <div className="h-1 bg-[#1a1a1a] my-2" />
            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="px-4 py-3 font-bold uppercase tracking-wide border-3 border-[#1a1a1a] bg-white shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#1a1a1a] transition-all"
                  onClick={() => {
                    playClick();
                    setMobileMenuOpen(false);
                  }}
                >
                  Profile
                </Link>
                <Link
                  href="/wallet"
                  className="px-4 py-3 font-bold uppercase tracking-wide border-3 border-[#1a1a1a] bg-white shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#1a1a1a] transition-all"
                  onClick={() => {
                    playClick();
                    setMobileMenuOpen(false);
                  }}
                >
                  Wallet
                </Link>
                <button
                  onClick={() => {
                    playClick();
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 font-bold uppercase tracking-wide text-[#FF6B6B] border-3 border-[#1a1a1a] bg-white shadow-[3px_3px_0_#1a1a1a] hover:bg-[#FF6B6B] hover:text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0_#1a1a1a] transition-all text-left"
                >
                  Log Out
                </button>
              </>
            ) : (
              <Button onClick={handleConnect} variant="primary" className="w-full" disabled={isPending}>
                {isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
