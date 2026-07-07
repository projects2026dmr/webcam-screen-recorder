import { Star, Check } from 'lucide-react';

const reasons = [
  {
    title: 'YouTubers & Video Creators',
    points: [
      'Record professional tutorials with screen + webcam recording',
      'Replace expensive screen recording software — this tool is free',
      'Capture HD and 4K video directly in your browser',
    ],
  },
  {
    title: 'Online Teachers & Educators',
    points: [
      'Record lessons using our free browser-based screen recorder',
      'Build an entire online course video library at no cost',
      'Students can watch from any device — no app needed',
    ],
  },
  {
    title: 'Remote Workers & Distributed Teams',
    points: [
      'Create async video updates with screen and webcam recording',
      'Record product demos and walkthroughs without scheduling calls',
      'Share troubleshooting videos with your team instantly',
    ],
  },
  {
    title: 'Developers & Software Engineers',
    points: [
      'Document bugs and issues with quick screen recordings',
      'Create code review walkthroughs with webcam overlay',
      'Record API and feature demos for technical documentation',
    ],
  },
  {
    title: 'Students & Academic Researchers',
    points: [
      'Record study sessions, online lectures, and presentations',
      'Create video assignments with screen + webcam recording',
      'Document research processes with a no-install recorder',
    ],
  },
  {
    title: 'Customer Support & Success Teams',
    points: [
      'Create step-by-step video guides for customer onboarding',
      'Record troubleshooting walkthroughs that outperform text docs',
      'Help customers solve problems faster with visual guides',
    ],
  },
];

export default function WhyCreatorsSection() {
  return (
    <section className="py-20 sm:py-28 bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-300">Trusted by Creators, Educators & Teams Worldwide</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Why Thousands Choose This Free Online Screen Recorder
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Whether you're a YouTuber, online educator, remote worker, or developer — our browser-based 
            screen and webcam recorder fits seamlessly into your workflow. No download needed, ever.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/50"
            >
              <h3 className="text-lg font-semibold text-white mb-4">{reason.title}</h3>
              <ul className="space-y-3">
                {reason.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
