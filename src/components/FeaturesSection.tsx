import { Monitor, Camera, Layers, Zap, Eye, Shield, Scissors, Mic } from 'lucide-react';

const features = [
  {
    icon: Monitor,
    color: 'text-brand-400 bg-brand-500/10',
    title: 'Free Online Screen Recorder',
    description:
      'Capture your entire screen, a specific application window, or a single browser tab — all from your browser. This no-install screen recorder is perfect for software demos, gameplay, and step-by-step tutorials.',
  },
  {
    icon: Camera,
    color: 'text-green-400 bg-green-500/10',
    title: 'HD & 4K Webcam Recorder',
    description:
      'Record yourself using your webcam in stunning HD or 4K quality. Ideal for vlogs, video messages, online course creation, and remote team updates. The best free webcam recorder for educators and creators.',
  },
  {
    icon: Layers,
    color: 'text-purple-400 bg-purple-500/10',
    title: 'Screen + Webcam Picture-in-Picture',
    description:
      'Record your screen with a webcam overlay in picture-in-picture mode. Choose any corner position and size. The go-to screen and webcam recording setup for YouTube tutorials and online teaching.',
  },
  {
    icon: Scissors,
    color: 'text-pink-400 bg-pink-500/10',
    title: 'Built-in Video Trim Editor',
    description:
      'Trim and cut your screen recordings directly in the browser. Set precise start and end points, preview your selection, and export only the parts you need — no external video editing software required.',
  },
  {
    icon: Mic,
    color: 'text-amber-400 bg-amber-500/10',
    title: 'Microphone Audio Selection',
    description:
      'Select your preferred microphone before recording. Whether you\'re using a built-in mic, USB microphone, headset, or professional audio interface — our browser-based recorder supports them all.',
  },
  {
    icon: Zap,
    color: 'text-yellow-400 bg-yellow-500/10',
    title: 'No Download, No Install Needed',
    description:
      'This screen recorder works 100% in your browser — no downloads, no plugins, no extensions. Open the page and start recording your screen or webcam instantly. A true no-install recording tool.',
  },
  {
    icon: Eye,
    color: 'text-cyan-400 bg-cyan-500/10',
    title: 'Instant Video Preview & Library',
    description:
      'Preview your screen recording immediately after capture. Save recordings to your personal library, replay anytime, and download when ready. All videos are stored locally in your browser — never on a server.',
  },
  {
    icon: Shield,
    color: 'text-rose-400 bg-rose-500/10',
    title: 'Privacy-First Screen Recording',
    description:
      'All screen and webcam recording happens locally in your browser. We never upload, access, or store your videos on external servers. Your recordings stay private — 100% of the time.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Powerful Browser-Based Screen Recorder Features
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A free online screen recorder packed with professional features for creators, educators, remote workers, and gamers. 
            No hidden fees, no watermarks, no install — the best no-download screen recording tool online.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="feature-card p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50"
            >
              <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
