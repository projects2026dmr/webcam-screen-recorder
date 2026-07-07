import { Shield, Lock, Eye, Server, CreditCard, FileCheck } from 'lucide-react';

const privacyPoints = [
  {
    icon: Lock,
    title: '100% Local Browser Processing',
    description: 'All screen and webcam recording happens directly in your browser. Your video data never leaves your device — nothing is uploaded during or after recording.',
  },
  {
    icon: Server,
    title: 'Zero Server Uploads',
    description: 'We never upload your recordings to any server. Your videos are stored in your browser\'s local storage until you choose to download them. Complete data privacy, guaranteed.',
  },
  {
    icon: Eye,
    title: 'No Content Tracking or Scanning',
    description: 'We don\'t analyze, scan, or track what you record. Your screen content, webcam footage, and audio remain completely private at all times.',
  },
  {
    icon: Shield,
    title: 'Secure Authentication',
    description: 'We use Google OAuth for sign-in — one of the most secure authentication methods available. We only request basic profile information (name and email).',
  },
  {
    icon: CreditCard,
    title: 'Completely Free, No Hidden Fees',
    description: 'This online screen recorder is 100% free to use. No credit card required. No premium tier needed. All recording features are available to everyone.',
  },
  {
    icon: FileCheck,
    title: 'No Watermarks on Recordings',
    description: 'Your screen recordings and webcam videos are completely clean — no watermarks, no logos, no branding. Export professional-quality video every time you record.',
  },
];

export default function PrivacySection() {
  return (
    <section id="privacy" className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">Privacy-First Design</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            A Private, Secure Screen Recorder You Can Trust
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            We built this free online screen recorder with privacy at its core. Your recordings never leave your device, 
            your data remains 100% yours, and there are absolutely no hidden catches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {privacyPoints.map((point) => (
            <div
              key={point.title}
              className="p-6 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-green-500/20 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4">
                <point.icon className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{point.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{point.description}</p>
            </div>
          ))}
        </div>

        {/* Trust statement */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            <strong className="text-slate-400">Our commitment:</strong> We believe privacy is a fundamental right. 
            This free, no-install screen recorder was designed to give you powerful recording features without ever compromising your personal data or video content.
          </p>
        </div>
      </div>
    </section>
  );
}
