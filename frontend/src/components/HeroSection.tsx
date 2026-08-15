export default function HeroSection() {
  const handleExploreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById('keyfeatures');
    const navHeight = document.querySelector('nav.landing-nav')?.clientHeight || 0;
    if (target) {
      window.scrollTo({
        top: target.offsetTop - navHeight,
        behavior: 'smooth',
      });
    }
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
      <video src="/assets/Background Video.mp4" muted loop autoPlay></video>
    </section>
  );
}
