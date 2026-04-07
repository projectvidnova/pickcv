import { useState } from 'react';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import HeroSection from './sections/HeroSection';
import FeaturesSection from './sections/FeaturesSection';
import AISection from './sections/AISection';
import HowItWorksSection from './sections/HowItWorksSection';
import TestimonialsSection from './sections/TestimonialsSection';
import CtaSection from './sections/CtaSection';
import ComingSoonModal from './sections/ComingSoonModal';

type RecruiterAction = 'register' | 'signin';

export default function ForRecruitersPage() {
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [comingSoonAction, setComingSoonAction] = useState<RecruiterAction>('register');

  const handleOpenComingSoon = (action: RecruiterAction) => {
    setComingSoonAction(action);
    setIsComingSoonOpen(true);
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection onOpenComingSoon={handleOpenComingSoon} />
      <FeaturesSection />
      <AISection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CtaSection onOpenComingSoon={handleOpenComingSoon} />
      <Footer />
      <ComingSoonModal
        isOpen={isComingSoonOpen}
        action={comingSoonAction}
        onClose={() => setIsComingSoonOpen(false)}
      />
    </main>
  );
}
