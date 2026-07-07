import { Play, CheckCircle } from 'lucide-react';

const benefits = [
  'No download or install needed',
  'No watermarks on screen recordings',
  'No time limits on recording',
  'HD and 4K recording quality',
  'Built-in video trim editor',
  'Privacy-first — 100% local recording',
  'Works on Chrome, Edge & Firefox',
  'Microphone & webcam selection',
];

export default function CTASection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-brand-600/20 via-purple-600/10 to-brand-800/20 border border-brand-500/20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Start Screen Recording Online — It's 100% Free
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Join thousands of creators, educators, and professionals who use our free online screen recorder 
            every day. No sign-up needed, no software to download. The best browser-based screen and webcam recording tool available.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {benefits.map((benefit) => (
              <div
                key={benefit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-sm text-slate-300"
              >
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                {benefit}
              </div>
            ))}
          </div>

          <a
            href="#recorder"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-brand-500/25 hover:-translate-y-0.5"
          >
            <Play className="w-5 h-5" />
            Record Your Screen Free — No Install
          </a>
        </div>
      </div>
    </section>
  );
}
