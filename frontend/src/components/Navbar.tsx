import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY >= 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  return (
    <nav className={`landing-nav${scrolled ? ' scroll' : ''}`}>
      <div className="logo">
        <h1>Agriva</h1>
      </div>
      <button
        className={`hamburger${menuOpen ? ' active' : ''}`}
        aria-label="Toggle navigation menu"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <div className={`nav-menu${menuOpen ? ' active' : ''}`}>
        <div className="links">
          <ul>
            <li>
              <a href="#home" onClick={handleLinkClick}>
                home
              </a>
            </li>
            <li>
              <a href="#keyfeatures" onClick={handleLinkClick}>
                key features
              </a>
            </li>
            <li>
              <a href="#purpose_of_it" onClick={handleLinkClick}>
                purpose of it
              </a>
            </li>
            <li>
              <a href="#howitworks" onClick={handleLinkClick}>
                how it works
              </a>
            </li>
          </ul>
        </div>
        <div className="button">
          <ul>
            <li className="tryit">
              <Link to="/app" onClick={() => setMenuOpen(false)}>
                Give a try
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
