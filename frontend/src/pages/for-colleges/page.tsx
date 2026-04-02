import { useNavigate } from 'react-router-dom';
import InstitutionNavbar from '../../components/feature/InstitutionNavbar';
import Footer from '../../components/feature/Footer';
import HeroSection from './sections/HeroSection';
import PlatformSection from './sections/PlatformSection';
import HowItWorksSection from './sections/HowItWorksSection';
import TestimonialsSection from './sections/TestimonialsSection';
import CtaSection from './sections/CtaSection';
import { resolvePath } from '../../utils/subdomain';

export default function ForCollegesPage() {
  const navigate = useNavigate();

  const handleRegister = () => navigate(resolvePath('/college/register'));
  const handleSignIn = () => navigate(resolvePath('/college/login'));

  return (
    <div className="min-h-screen bg-white">
      <InstitutionNavbar />
      <HeroSection onRegister={handleRegister} onSignIn={handleSignIn} />
      <PlatformSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CtaSection onRegister={handleRegister} onSignIn={handleSignIn} />
      <Footer />
    </div>
  );
}
