
import Navbar from '../../components/feature/Navbar';
import Footer from '../../components/feature/Footer';
import Hero from './sections/Hero';
import Features from './sections/Features';
import Testimonials from './sections/Testimonials';

export default function HomePage() {
  return (
    <main className="min-h-screen mesh-bg">
      <Navbar />
      <Hero />
      <Features />
      <Testimonials />
      <Footer />
    </main>
  );
}
