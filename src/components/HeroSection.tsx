import { Play, Monitor, Camera, Sparkles, Scissors, Mic } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-brand-400" />
            <span className="text-sm font-medium text-brand-300">100% Free Online Screen Recorder • No Download • HD & 4K Quality</span>
          </div>

          {/* H1 - Primary keyword target */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
            Free <span className="gradient-text">Webcam & Screen Recorder</span> Online
          </h1>

          {/* Subheadline with LSI keywords */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            The best free online screen recorder that works right in your browser — no downloads, no installs, no sign-up. 
            Record your screen and webcam in HD or 4K for <strong className="text-white">YouTube tutorials</strong>,{' '}
            <strong className="text-white">online courses</strong>,{' '}
            <strong className="text-white">product demos</strong>, and{' '}
            <strong className="text-white">remote team meetings</strong> in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <a
              href="#recorder"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5"
            >
              <Play className="w-5 h-5" />
              Start Free Screen Recording
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl text-lg transition-colors border border-white/10"
            >
              See How Screen Recording Works
            </a>
          </div>

          {/* Quick feature highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-brand-400" />
              <span>Browser Screen Recorder</span>
            </div>
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-green-400" />
              <span>Online Webcam Recorder</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                <Monitor className="w-4 h-4 text-brand-400" />
                <Camera className="w-4 h-4 text-green-400" />
              </div>
              <span>Screen + Webcam Recording</span>
            </div>
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-purple-400" />
              <span>Built-in Video Trimmer</span>
            </div>
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-amber-400" />
              <span>Microphone Selection</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
