'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Users, RotateCcw, MessageCircle, Bookmark, HelpCircle, MessageSquareText } from 'lucide-react';
import Link from 'next/link';
import ConversationNotifications from './ConversationNotifications';
import { DrawerToggle } from './MobileDrawer';
import ThemeToggle from './ThemeToggle';
import NavbarMessageDropdown from '@/components/Messages/NavbarMessageDropdown';

// Rotating search placeholder examples
const SEARCH_PLACEHOLDERS = [
  "Find a conversation about AI regulation...",
  "Find a debate happening now...",
  "Find where people disagree...",
  "Find perspectives on climate policy...",
  "Find threads with active discussion...",
];

interface UserProfile {
  username: string;
  image?: string | null;
}

export default function Navbar() {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [resumeCount, setResumeCount] = useState(0);

  // Fetch user profile and resume count
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    const fetchResumeCount = async () => {
      try {
        const res = await fetch('/api/user/resume?limit=1');
        if (res.ok) {
          const data = await res.json();
          setResumeCount(data.totalActive || 0);
        }
      } catch (e) {
        console.error('Error fetching resume count:', e);
      }
    };

    fetchUser();
    fetchResumeCount();

    // Refresh resume count every 60 seconds
    const resumeInterval = setInterval(fetchResumeCount, 60000);
    return () => clearInterval(resumeInterval);
  }, []);

  // Rotate placeholder every 4 seconds (only when not typing)
  useEffect(() => {
    if (isTyping) return;

    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isTyping]);

  return (
    <>
      <div className="navbar bg-base-100/80 backdrop-blur-md fixed top-0 z-50 border-b border-base-content/10 px-2 sm:px-4 min-h-[64px] md:min-h-[72px]" style={{ paddingTop: 'var(--safe-area-top)' }}>

        {/* Start: Mobile Drawer Toggle & Logo */}
        <div className="navbar-start gap-1 sm:gap-4">
          {/* Mobile Drawer Toggle */}
          <DrawerToggle />

          {/* Logo - Smaller on mobile */}
          <Link href="/" className="btn btn-ghost text-lg sm:text-2xl font-black px-1 sm:px-2 tracking-widest hover:bg-transparent" style={{ fontFamily: '"Orbitron", sans-serif' }}>
            <span className="bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-600 bg-clip-text text-transparent drop-shadow-[0_0_5px_rgba(6,182,212,0.5)] italic">
              <span className="hidden xs:inline">RESONATE</span>
              <span className="xs:hidden">R</span>
            </span>
          </Link>
        </div>

        {/* Center: Search Bar - Desktop only */}
        <div className="navbar-center hidden md:flex flex-1 max-w-2xl lg:max-w-3xl mx-2 lg:mx-4">
          <label className="input input-bordered flex items-center gap-2 w-full rounded-full bg-base-200/50 hover:bg-base-200/70 focus-within:bg-base-100 focus-within:border-primary transition-all h-10 lg:h-11 group">
            <Search className="h-4 w-4 opacity-50 group-focus-within:opacity-100 group-focus-within:text-primary transition-all flex-shrink-0" />
            <input
              type="text"
              className="grow text-sm min-w-0"
              placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setIsTyping(false)}
            />
          </label>
        </div>

        {/* End: Actions & Profile - Improved spacing */}
        <div className="navbar-end gap-1 sm:gap-2 lg:gap-3">

          {/* Mobile Search Button - Improved touch target */}
          <button
            className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full hover:bg-base-content/10 transition-colors md:hidden touch-active"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            aria-label="Search"
          >
            <Search className="h-5 w-5 opacity-70" />
          </button>

          {/* 🔴 Live Indicator - Hidden on mobile, improved touch target on tablet */}
          <Link
            href="/signal?filter=live"
            className="hidden sm:flex items-center gap-1 min-h-[44px] px-2 lg:px-3 rounded-full hover:bg-error/10 transition-colors touch-active"
            title="Live conversations"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
            </span>
            <span className="text-error font-medium hidden lg:inline text-sm">Live</span>
          </Link>

          {/* Resume - Shows count badge when conversations are waiting */}
          <Link
            href="/signal?filter=live"
            className={`hidden sm:flex items-center gap-1 min-h-[44px] px-2 lg:px-3 rounded-full transition-colors touch-active ${resumeCount > 0 ? 'text-cyan-500 hover:bg-cyan-500/10' : 'hover:bg-base-content/10'}`}
            title="Resume conversations"
          >
            <RotateCcw className="h-4 w-4" />
            {resumeCount > 0 ? (
              <>
                <span className="hidden lg:inline text-sm font-medium">Resume</span>
                <span className="badge badge-xs badge-info">{resumeCount}</span>
              </>
            ) : (
              <span className="hidden lg:inline text-sm opacity-70">Resume</span>
            )}
          </Link>

          {/* Start a Conversation - Hidden on mobile (use bottom nav instead) */}
          <details className="dropdown dropdown-end hidden sm:block">
            <summary className="btn btn-sm btn-primary gap-1 sm:gap-2 rounded-full font-normal list-none m-0 px-2 sm:px-3 min-h-[44px] touch-active">
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline">Start a Conversation</span>
              <span className="sm:inline lg:hidden">New</span>
            </summary>
            <ul className="absolute right-0 top-full mt-1 z-[60] p-2 shadow-xl menu menu-sm dropdown-content bg-base-100/90 backdrop-blur-xl rounded-box w-[calc(100vw-2rem)] max-w-xs md:w-56 border border-white/10">
              <li>
                <Link href="/submit" className="gap-3">
                  <MessageCircle className="w-4 h-4" />
                  Start a conversation
                </Link>
              </li>
              <li>
                <Link href="/submit?type=question" className="gap-3">
                  <HelpCircle className="w-4 h-4" />
                  Ask a question
                </Link>
              </li>
              <li>
                <Link href="/submit?type=perspective" className="gap-3">
                  <MessageSquareText className="w-4 h-4" />
                  Share a perspective
                </Link>
              </li>
              <li className="border-t border-base-content/5 mt-1 pt-1">
                <Link href="/create-community" className="gap-3">
                  <Users className="w-4 h-4" />
                  Create Community
                </Link>
              </li>
            </ul>
          </details>

          {/* Messages Dropdown */}
          <NavbarMessageDropdown />

          {/* Notifications */}
          <ConversationNotifications />

          {/* Theme Toggle - Hidden on small mobile */}
          <div className="hidden sm:flex">
            <ThemeToggle />
          </div>

          {/* Profile Dropdown - Improved touch target */}
          <details className="dropdown dropdown-end ml-1 group">
            <summary role="button" className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full cursor-pointer hover:bg-base-content/10 transition-colors list-none touch-active">
              <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full ring-2 ring-base-100 overflow-hidden">
                {user?.image ? (
                  <img src={user.image} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="bg-gradient-to-tr from-accent to-primary text-primary-content w-full h-full flex items-center justify-center">
                    <span className="text-xs font-bold">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                )}
              </div>
            </summary>
            <ul className="absolute right-0 top-full mt-2 z-[1] p-2 shadow-xl menu menu-sm dropdown-content bg-base-100/90 backdrop-blur-xl rounded-box w-56 border border-white/10 motion-scale-in-[0.95] motion-opacity-in-[0%] motion-blur-in-[5px] motion-duration-200 origin-top-right">
              <li className="menu-title px-4 py-2 text-xs border-b border-base-content/5 mb-1 opacity-70">
                <span>Signed in as <b className="text-base-content font-bold">{user?.username || 'User'}</b></span>
              </li>

              {/* Conversation-focused options */}
              <li>
                <Link href="/profile?tab=comments" className="gap-3">
                  <MessageCircle className="w-4 h-4" />
                  Your Conversations
                </Link>
              </li>
              <li>
                <Link href="/profile?tab=followed" className="gap-3">
                  <Bookmark className="w-4 h-4" />
                  Followed Threads
                </Link>
              </li>
              <li>
                <Link href="/profile?tab=communities" className="gap-3">
                  <Users className="w-4 h-4" />
                  Your Communities
                </Link>
              </li>

              <li className="border-t border-base-content/5 mt-1 pt-1">
                <Link href="/profile">Profile</Link>
              </li>
              <li><Link href="/settings">Settings</Link></li>
              <li><a className="text-error">Logout</a></li>
            </ul>
          </details>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-[60] bg-base-100/95 backdrop-blur-md pt-16 px-4 md:hidden">
          <div className="flex items-center gap-2">
            <label className="input input-bordered flex items-center gap-2 w-full rounded-full bg-base-200/50 h-12 group flex-1">
              <Search className="h-5 w-5 opacity-50 group-focus-within:opacity-100 group-focus-within:text-primary transition-all" />
              <input
                type="text"
                className="grow text-base"
                placeholder="Find a conversation..."
                autoFocus
                onBlur={() => setTimeout(() => setShowMobileSearch(false), 200)}
              />
            </label>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowMobileSearch(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
