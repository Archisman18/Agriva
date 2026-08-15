import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import KeyFeatures from '../components/KeyFeatures';
import PurposeSection from '../components/PurposeSection';
import HowItWorks from '../components/HowItWorks';
import Footer from '../components/Footer';
import '../styles/index.css';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <KeyFeatures />
      <PurposeSection />
      <HowItWorks />
      <Footer />
    </>
  );
}
