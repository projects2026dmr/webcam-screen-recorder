import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Is this online screen and webcam recorder completely free?',
    answer:
      'Yes! Our free online screen recorder and webcam recorder is 100% free to use. There are no hidden fees, no premium tiers required, no watermarks on your recordings, and no time limits. Record as many HD or 4K videos as you need, whenever you need them — completely free.',
  },
  {
    question: 'Do I need to download or install anything to record my screen?',
    answer:
      'No download or installation is required. Our no-install screen recorder works entirely in your web browser using modern web APIs. Simply open the website, choose your recording mode (screen, webcam, or screen + webcam), and start capturing. No plugins, no extensions, no software downloads — it\'s a true browser-based screen recording tool.',
  },
  {
    question: 'Can I record my screen and webcam at the same time?',
    answer:
      'Absolutely! Our screen and webcam recorder supports picture-in-picture (PiP) mode. Record your screen with a webcam overlay, with customizable position (top-left, top-right, bottom-left, bottom-right) and size controls (small, medium, large). This is perfect for YouTube tutorials, online courses, software walkthroughs, product demos, and presentations.',
  },
  {
    question: 'Does the countdown overlay appear on the recorded screen?',
    answer:
      'Yes! The 5-second countdown is rendered directly on your recording stream using canvas compositing. When you select a tab or window to record, the 5-4-3-2-1 countdown appears ON that content so you always know when the recording starts — even if you\'ve switched to a different browser tab.',
  },
  {
    question: 'Are my screen recordings stored online or on a server?',
    answer:
      'No. All screen and webcam recordings are processed and stored 100% locally in your browser using IndexedDB. We never upload your videos to any server. Your data stays completely private on your device until you choose to download. This is a privacy-first, browser-based screen recorder.',
  },
  {
    question: 'Can I trim or edit my screen recording in the browser?',
    answer:
      'Yes! Our built-in video trim editor lets you select precise start and end points to cut your screen recording. Preview your selection in real-time and export only the parts you need — all without downloading any external editing software. It\'s a complete browser-based video trimming solution.',
  },
  {
    question: 'Which browsers support this free online screen recorder?',
    answer:
      'Our browser-based screen recorder works on all modern browsers including Google Chrome, Microsoft Edge, and Mozilla Firefox. For the best experience with all features (especially screen recording with system audio capture), we recommend using the latest version of Google Chrome or Microsoft Edge.',
  },
  {
    question: 'What recording resolution and video quality options are available?',
    answer:
      'You can record in HD quality with presets for 720p, 1080p Full HD, 1440p QHD, 4K Ultra HD, or Original resolution (which captures at your screen\'s native resolution). You can also choose from Low, Medium, or High bitrate options to balance file size and recording quality.',
  },
  {
    question: 'Can I choose which microphone to use for screen recording?',
    answer:
      'Yes! Before you start recording, you can select your preferred microphone from a dropdown menu. Whether you\'re using a built-in laptop mic, USB microphone, wireless headset, or professional audio interface — our free screen recorder supports all audio input devices.',
  },
  {
    question: 'Why is Google Sign-In required to download recordings?',
    answer:
      'We use Google Sign-In as a simple, secure authentication method to protect our free screen recording service and ensure quality for all users. Recording and previewing are completely free without any sign-in. You only need to authenticate with Google when you want to download your recorded videos.',
  },
  {
    question: 'What happens when I click "Stop Sharing" in Chrome or Edge?',
    answer:
      'When you stop sharing your screen via the browser\'s native "Stop Sharing" button (or click our Stop Recording button), the app automatically detects this event, stops the recording, and takes you directly to the preview screen where you can review, trim, save, or download your video.',
  },
  {
    question: 'Who is this free browser-based screen recorder designed for?',
    answer:
      'Our free online screen recorder is designed for anyone who needs to capture screen or webcam content: YouTubers creating tutorials, educators building online courses, remote workers recording presentations, product managers creating demos, developers documenting code, customer support teams making walkthrough videos, gamers capturing gameplay, and students recording study sessions. If you can open a browser, you can record your screen for free.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Screen Recorder FAQ — Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-400">
            Everything you need to know about our free online screen recorder and webcam recorder. 
            Find answers about recording quality, browser support, privacy, and more.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-start justify-between gap-4 hover:bg-slate-800/80 transition-colors"
                aria-expanded={openIndex === index}
              >
                <h3 className="text-sm sm:text-base font-medium text-white pr-4">
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 animate-fade-in">
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
