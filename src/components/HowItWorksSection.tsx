import { MousePointerClick, Settings2, CirclePlay, Download } from 'lucide-react';

const steps = [
  {
    step: '1',
    icon: MousePointerClick,
    color: 'from-brand-500 to-brand-600',
    title: 'Select Screen, Webcam, or Both',
    description:
      'Choose whether to record your screen only, your webcam only, or use screen + webcam recording with a picture-in-picture overlay. Customize webcam position and size to match your style.',
  },
  {
    step: '2',
    icon: Settings2,
    color: 'from-purple-500 to-purple-600',
    title: 'Set Resolution, Mic & Quality',
    description:
      'Pick your preferred recording resolution from 720p HD to 4K Ultra HD. Select your microphone, choose bitrate settings, and pick which screen, window, or browser tab to capture.',
  },
  {
    step: '3',
    icon: CirclePlay,
    color: 'from-green-500 to-green-600',
    title: 'Start Recording with Countdown',
    description:
      'Click "Start Recording" and a 5-second countdown appears directly on your recorded content — visible even if you switch to another tab. You always know exactly when recording begins.',
  },
  {
    step: '4',
    icon: Download,
    color: 'from-amber-500 to-amber-600',
    title: 'Preview, Trim & Download Free',
    description:
      'When finished, instantly preview your recording, trim it with our built-in editor, save it to your library, and sign in with Google to download your video. It\'s completely free!',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-slate-800/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            How to Record Your Screen Online for Free in 4 Easy Steps
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Start recording your screen or webcam in under 30 seconds. No sign-up and no installation required — this free browser-based screen recorder just works.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, idx) => (
            <div key={item.step} className="relative text-center">
              {/* Connector line for desktop */}
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-slate-600 to-transparent" />
              )}

              <div className="flex flex-col items-center">
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <item.icon className="w-10 h-10 text-white" />
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-brand-400 text-sm font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
