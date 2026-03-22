import { useState } from 'react';
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import HeroSection from './sections/HeroSection';
import PlatformSection from './sections/PlatformSection';
import HowItWorksSection from './sections/HowItWorksSection';
import TestimonialsSection from './sections/TestimonialsSection';
import CtaSection from './sections/CtaSection';
import ComingSoonModal from './sections/ComingSoonModal';

type CollegeAction = 'register' | 'signin';

export default function ForCollegesPage() {
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [comingSoonAction, setComingSoonAction] = useState<CollegeAction>('register');

  const handleOpenComingSoon = (action: CollegeAction) => {
    setComingSoonAction(action);
    setIsComingSoonOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection onOpenComingSoon={handleOpenComingSoon} />
      <PlatformSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CtaSection onOpenComingSoon={handleOpenComingSoon} />
      <Footer />
      <ComingSoonModal
        isOpen={isComingSoonOpen}
        action={comingSoonAction}
        onClose={() => setIsComingSoonOpen(false)}
      />
    </div>
  );
}
