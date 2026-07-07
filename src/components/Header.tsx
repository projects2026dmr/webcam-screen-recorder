import { Video, LogOut, User as UserIcon, Menu, X } from 'lucide-react';
import { useState } from 'react';
import type { User } from '../hooks/useAuth';

interface HeaderProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Header({ user, onSignIn, onSignOut }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 glass border-b border-slate-700/50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group" aria-label="WebCam & Screen Recorder home">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">
              WebCam<span className="text-brand-400">&</span>Screen Recorder
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-300 hover:text-white transition-colors">Recorder Features</a>
            <a href="#how-it-works" className="text-sm text-slate-300 hover:text-white transition-colors">How to Record</a>
            <a href="#privacy" className="text-sm text-slate-300 hover:text-white transition-colors">Privacy & Security</a>
            <a href="#faq" className="text-sm text-slate-300 hover:text-white transition-colors">FAQ</a>
            <a href="#recorder" className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">Free Screen Recorder</a>
            
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm text-slate-200">{user.name}</span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-700/50 animate-fade-in">
            <div className="flex flex-col gap-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-300 hover:text-white py-2">Recorder Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-300 hover:text-white py-2">How to Record</a>
              <a href="#privacy" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-300 hover:text-white py-2">Privacy & Security</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm text-slate-300 hover:text-white py-2">FAQ</a>
              <a href="#recorder" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-brand-400 py-2">Free Screen Recorder</a>
              {user ? (
                <button onClick={onSignOut} className="text-sm text-slate-300 hover:text-white py-2 text-left">Sign Out ({user.name})</button>
              ) : (
                <button onClick={() => { onSignIn(); setMobileMenuOpen(false); }} className="text-sm text-brand-400 py-2 text-left">Sign In with Google</button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
