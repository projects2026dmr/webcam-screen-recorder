import { Video, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800 bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center">
                <Video className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">
                WebCam & Screen Recorder
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              The best free online screen recorder and webcam recorder. Record HD and 4K video 
              directly in your browser — no downloads, no installs, no watermarks, no time limits. 
              A privacy-first, no-install screen recording tool for creators, educators, and professionals.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="#recorder" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">Free Screen Recorder</a></li>
              <li><a href="#features" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">Recorder Features</a></li>
              <li><a href="#how-it-works" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">How to Record Your Screen</a></li>
              <li><a href="#privacy" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">Privacy & Security</a></li>
              <li><a href="#faq" className="text-sm text-slate-400 hover:text-brand-400 transition-colors">Screen Recorder FAQ</a></li>
            </ul>
          </div>

          {/* Use Cases */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Screen Recording Use Cases</h3>
            <ul className="space-y-2">
              <li className="text-sm text-slate-400">YouTube Tutorial Recording</li>
              <li className="text-sm text-slate-400">Online Course & Lesson Recording</li>
              <li className="text-sm text-slate-400">Product Demo & Walkthrough Videos</li>
              <li className="text-sm text-slate-400">Remote Team Video Updates</li>
              <li className="text-sm text-slate-400">Gameplay & Streaming Capture</li>
              <li className="text-sm text-slate-400">Customer Support Video Guides</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {currentYear} WebCam & Screen Recorder. All rights reserved. 
            Free online screen recorder and webcam recorder for creators, educators, and professionals.
          </p>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500" /> for creators worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}
