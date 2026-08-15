import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FieldDataProvider } from './context/FieldDataContext';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';

function App() {
  return (
    <FieldDataProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<AppPage />} />
        </Routes>
      </Router>
    </FieldDataProvider>
  );
}

export default App;
