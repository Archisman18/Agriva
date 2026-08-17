import { scrollToSection } from '../utils/smoothScroll';

export default function HeroSection() {
  const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToSection('keyfeatures');
  };

  return (
    <section className="home" id="home">
      <div className="overlay">
        <div className="content">
          <h1>
            <span className="green">Agriva </span>
          </h1>
          <h2>
            Smart <span className="gold">Satellite AI-Powered Personalized Crop Planner</span>
          </h2>
          <p>
            Agriva is an intelligent crop planning tool that uses satellite data and AI to optimize
            planting schedules, monitor field conditions, and boost yields, helping farmers make
            data-driven agricultural decisions.
          </p>
          <a href="#keyfeatures" className="explore-button" onClick={handleExploreClick}>
            Explore Key features
          </a>
        </div>
      </div>
      <video src="/assets/background.mp4" muted loop autoPlay playsInline></video>
    </section>
  );
}
