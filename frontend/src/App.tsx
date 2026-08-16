import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FieldDataProvider } from './context/FieldDataContext';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';
import ChatbotWidget from './components/ChatbotWidget';

function App() {
  return (
    <FieldDataProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/app" element={<AppPage />} />
            </Routes>
          </main>
          <ChatbotWidget />
        </div>
      </Router>
    </FieldDataProvider>
  );
}

export default App;
