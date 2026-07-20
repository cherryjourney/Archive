import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import IntroSection from "@/components/IntroSection";
import FeatureShowcase from "@/components/FeatureShowcase";
import PhilosophySection from "@/components/PhilosophySection";
import DownloadSection from "@/components/DownloadSection";
import Footer from "@/components/Footer";
import AmbientParticles from "@/components/AmbientParticles";

export default function HomePage() {
  return (
    <>
      {/* Global ambient layer */}
      <AmbientParticles />

      {/* Navigation */}
      <Navbar />

      {/* Main content — z-index 2 to sit above particles */}
      <main style={{ position: "relative", zIndex: 2 }}>
        <Hero />
        <IntroSection />
        <FeatureShowcase />
        <PhilosophySection />
        <DownloadSection />
      </main>

      <Footer />
    </>
  );
}
