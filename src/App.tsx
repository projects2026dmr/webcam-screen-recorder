/**
 * WebCam & Screen Recorder — Free Online Tool
 * COMPLETE REWRITE - Fully Functional Version
 */

import { useRef, useCallback } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import RecorderPanel from './components/RecorderPanel';
import LibrarySection from './components/LibrarySection';
import PrivacySection from './components/PrivacySection';
import WhyCreatorsSection from './components/WhyCreatorsSection';
import FAQSection from './components/FAQSection';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ToastContainer from './components/ToastContainer';

import { useRecorder } from './hooks/useRecorder';
import { useLibrary } from './hooks/useLibrary';
import { useAuth } from './hooks/useAuth';
import { useToast } from './hooks/useToast';

export default function App() {
  const recorder = useRecorder();
  const library = useLibrary();
  const auth = useAuth();
  const toast = useToast();
  
  const librarySectionRef = useRef<HTMLElement>(null);

  // Handle save success - show toast and scroll to library
  const handleSaveSuccess = useCallback(() => {
    toast.success('Recording saved to your library!');
    setTimeout(() => {
      librarySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  }, [toast]);

  // Handle download with auth requirement
  const handleDownload = useCallback((item: Parameters<typeof library.downloadRecording>[0]) => {
    library.downloadRecording(item);
    toast.success('Download started!');
  }, [library, toast]);

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    const success = await library.removeFromLibrary(id);
    if (success) {
      toast.info('Recording deleted');
    } else {
      toast.error('Failed to delete recording');
    }
  }, [library, toast]);

  return (
    <div className="min-h-screen bg-surface text-white font-sans">
      {/* Skip link */}
      <a
        href="#recorder"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
      >
        Skip to recorder
      </a>

      <Header
        user={auth.user}
        onSignIn={() => auth.setShowAuthModal(true)}
        onSignOut={auth.signOut}
      />

      <main>
        <HeroSection />

        <RecorderPanel
          state={recorder.state}
          countdown={recorder.countdown}
          elapsedTime={recorder.elapsedTime}
          recordingResult={recorder.recordingResult}
          webcamDevices={recorder.webcamDevices}
          microphoneDevices={recorder.microphoneDevices}
          selectedWebcam={recorder.selectedWebcam}
          selectedMicrophone={recorder.selectedMicrophone}
          selectedQuality={recorder.selectedQuality}
          selectedBitrate={recorder.selectedBitrate}
          selectedMode={recorder.selectedMode}
          webcamPosition={recorder.webcamPosition}
          webcamSize={recorder.webcamSize}
          webcamStream={recorder.webcamStream}
          error={recorder.error}
          setSelectedWebcam={recorder.setSelectedWebcam}
          setSelectedMicrophone={recorder.setSelectedMicrophone}
          setSelectedQuality={recorder.setSelectedQuality}
          setSelectedBitrate={recorder.setSelectedBitrate}
          setSelectedMode={recorder.setSelectedMode}
          setWebcamPosition={recorder.setWebcamPosition}
          setWebcamSize={recorder.setWebcamSize}
          startRecording={recorder.startRecording}
          stopRecording={recorder.stopRecording}
          clearRecording={recorder.clearRecording}
          refreshDevices={recorder.refreshDevices}
          onSaveToLibrary={library.addToLibrary}
          onSaveSuccess={handleSaveSuccess}
        />

        <LibrarySection
          ref={librarySectionRef}
          items={library.items}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onRequireAuth={auth.requireAuth}
        />

        <FeaturesSection />
        <HowItWorksSection />
        <PrivacySection />
        <WhyCreatorsSection />
        <FAQSection />
        <CTASection />
      </main>

      <Footer />

      <AuthModal
        show={auth.showAuthModal}
        loading={auth.authLoading}
        error={auth.authError}
        onClose={() => auth.setShowAuthModal(false)}
        onSignIn={auth.signInWithGoogle}
      />

      <ToastContainer
        toasts={toast.toasts}
        onRemove={toast.removeToast}
      />
    </div>
  );
}
