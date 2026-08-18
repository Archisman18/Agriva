import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFieldData } from '../context/FieldDataContext';
import MapView from '../components/MapView';
import BudgetToolsForm from '../components/BudgetToolsForm';
import AnalysisResults from '../components/AnalysisResults';
import { searchLocation } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import type { FieldData } from '../types';
import '../styles/app.css';

export default function AppPage() {
  const [showResults, setShowResults] = useState(false);
  const [analysisData, setAnalysisData] = useState<FieldData | null>(null);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [locationStatusClass, setLocationStatusClass] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [manualLocationInput, setManualLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRequestRef = useRef(0);

  const { soilType } = useFieldData();
  const { getLocation } = useGeolocation();

  const callUpdateMap = (lat: number, lng: number) => {
    const tryUpdateMap = (attempt: number) => {
      const updateMap = (window as unknown as Record<string, unknown>).__agriva_updateMap as
        | ((lat: number, lng: number) => void)
        | undefined;
      if (updateMap) {
        updateMap(lat, lng);
      } else if (attempt < 10) {
        window.setTimeout(() => tryUpdateMap(attempt + 1), 50);
      }
    };
    tryUpdateMap(0);
  };

  const handleGpsLocation = () => {
    setLocationStatus('Getting your location...');
    setLocationStatusClass('text-sm text-green-700 mt-2 font-medium');
    setShowManualCoords(false);

    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      setLocationStatusClass('text-sm text-red-500 mt-2 font-medium');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatInput(lat.toFixed(6));
        setLngInput(lng.toFixed(6));
        callUpdateMap(lat, lng);
        setLocationStatus('Location found successfully!');
        setLocationStatusClass('text-sm text-green-700 mt-2 font-medium');
      },
      (error) => {
        let errorMessage = 'Error getting location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'Location access denied. Please enable location services in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out.';
            break;
        }
        setLocationStatus(errorMessage);
        setLocationStatusClass('text-sm text-red-500 mt-2 font-medium');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualCoords = () => {
    const lat = parseFloat(latInput);
    const lng = parseFloat(lngInput);
    if (!isNaN(lat) && !isNaN(lng)) {
      callUpdateMap(lat, lng);
      setLocationStatus('Manual coordinates applied!');
      setLocationStatusClass('text-sm text-green-700 mt-2 font-medium');
    } else {
      setLocationStatus('Please enter valid latitude and longitude.');
      setLocationStatusClass('text-sm text-red-500 mt-2 font-medium');
    }
  };

  const handleManualLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const requestId = ++searchRequestRef.current;
    setManualLocationInput(val);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (val.trim().length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(val);
        if (requestId !== searchRequestRef.current) return;
        if (results && results.length > 0) {
          setLocationSuggestions(results);
          setShowSuggestions(true);
        } else {
          setLocationSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        if (requestId !== searchRequestRef.current) return;
        console.error('Error fetching location suggestions:', error);
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    }, 100);
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setManualLocationInput(suggestion.display_name);
    setShowSuggestions(false);
    
    const lat = Number(suggestion.lat);
    const lng = Number(suggestion.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setLocationStatus('Location coordinates are invalid. Please try another result.');
      setLocationStatusClass('text-sm text-red-500 mt-2 font-medium');
      return;
    }
    
    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
    callUpdateMap(lat, lng);
    
    setLocationStatus(`Location found: ${suggestion.display_name}`);
    setLocationStatusClass('text-sm text-green-700 mt-2 font-medium');
  };

  const handleSearchLocation = async () => {
    if (!manualLocationInput) {
      setLocationStatus('Please enter a location name.');
      setLocationStatusClass('text-sm text-red-500 mt-2 font-medium');
      return;
    }

    if (locationSuggestions.length > 0) {
      handleSelectSuggestion(locationSuggestions[0]);
      return;
    }

    setLocationStatus('Searching for location...');
    setLocationStatusClass('text-sm text-green-700 mt-2 font-medium');

    try {
      const results = await searchLocation(manualLocationInput);
      if (results && results.length > 0) {
        handleSelectSuggestion(results[0]);
      } else {
        setLocationStatus('Location not found. Please try a different name.');
        setLocationStatusClass('text-sm text-red-500 mt-2 font-medium');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setLocationStatus('Error searching location. Please try again.');
      setLocationStatusClass('text-sm text-red-500 mt-2 font-medium');
    }
  };

  const handleAnalysisComplete = (data: FieldData) => {
    setAnalysisData(data);
    setShowResults(true);
  };

  const handleReset = () => {
    setShowResults(false);
    setAnalysisData(null);
    window.location.reload();
  };

  if (showResults && analysisData) {
    return (
      <>
        <div className="app-bg-animated"></div>
        <div className="app-page-body flex items-center justify-center">
          <AnalysisResults data={analysisData} onReset={handleReset} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="app-bg-animated"></div>
      <div className="app-page-body flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Controls (40%) */}
      <div className="lg:w-2/5 flex flex-col gap-6 lg:h-[calc(100vh-4rem)] overflow-y-auto pr-2 animate-slide-up" style={{ scrollbarWidth: 'thin' }}>
        
        {/* Back Button */}
        <div className="pt-2 shrink-0">
          <Link to="/" className="text-[#6B4E3D] hover:text-[#C4703A] inline-flex items-center gap-2 font-medium transition-colors bg-[#F7F3EA]/50 px-4 py-2 rounded-full border border-[#D4A857]/30 shadow-sm hover:shadow w-fit">
            <i className="fa-solid fa-arrow-left"></i> Back to Landing Page
          </Link>
        </div>

        {/* Header Glass Panel */}
        <div className="glass-panel p-6 sm:p-8 text-center bg-gradient-to-br from-[#F7F3EA] to-[#ffffff] border border-[#D4A857]/40 shadow-md relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2F5233]/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#C4703A]/5 rounded-full -ml-10 -mb-10 blur-xl pointer-events-none"></div>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#2F5233]/10 mb-4 border border-[#2F5233]/20 shadow-sm relative z-10">
             <i className="fa-solid fa-leaf text-[#2F5233] text-2xl"></i>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2F5233] mb-2 font-serif relative z-10">
            Agriva Dashboard
          </h1>
          <p className="text-[#6B4E3D] font-medium relative z-10">Empowering Smarter Farming Decisions</p>
        </div>

        {/* Field Summary Strip */}
        {latInput && lngInput && (
          <div className="bg-[#D4A857]/20 border border-[#D4A857]/50 rounded-lg p-3 flex flex-wrap gap-4 text-sm font-medium mb-4 text-[#2B2420] shrink-0 animate-slide-up">
            <span className="flex items-center gap-1">
              <i className="fa-solid fa-location-dot text-[#C4703A]"></i> {latInput}, {lngInput}
            </span>
            {soilType && !soilType.toLowerCase().includes('n/a') && (
              <span className="flex items-center gap-1">
                <i className="fa-solid fa-earth-americas text-[#6B4E3D]"></i> {soilType}
              </span>
            )}
          </div>
        )}

        {/* Locate your field Glass Panel */}
        <div className="glass-panel p-6 mb-6 shrink-0">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2 border-b border-gray-200/50 pb-4">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#C4703A] text-white flex items-center justify-center text-sm font-bold shadow-sm font-sans">1</span>
              Locate your field
            </h2>
          </div>

          {/* Location Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button onClick={handleGpsLocation} className="btn-primary-glass flex-1">
              <i className="fa-sharp fa-solid fa-location-crosshairs"></i>
              GPS Locate
            </button>
            <button onClick={() => setShowManualCoords(!showManualCoords)} className="btn-secondary-glass flex-1 flex items-center justify-center gap-2">
              <i className="fa-sharp fa-solid fa-globe"></i>
              Manual Coords
            </button>
          </div>

          {/* Manual Coordinate Input */}
          {showManualCoords && (
            <div className="space-y-4 mb-6 p-4 bg-white/40 rounded-xl border border-white/50 animate-slide-up">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">Latitude:</label>
                <input
                  type="text"
                  placeholder="e.g., 30.0444"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  className="glass-input w-full"
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-1">Longitude:</label>
                <input
                  type="text"
                  placeholder="e.g., 31.2357"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  className="glass-input w-full"
                />
              </div>
              <button onClick={handleManualCoords} className="btn-primary-glass w-full">
                Apply Coordinates
              </button>
            </div>
          )}

          {/* Location Autocomplete Input */}
          <div className="relative z-50">
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Or search for a region / city:
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fa-solid fa-magnifying-glass text-gray-400"></i>
              </div>
              <input
                type="text"
                placeholder="e.g., Nile Delta, Egypt"
                value={manualLocationInput}
                onChange={handleManualLocationChange}
                onFocus={() => {
                  if (locationSuggestions.length > 0) setShowSuggestions(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleSearchLocation();
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="glass-input w-full"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
            
            {showSuggestions && locationSuggestions.length > 0 && (
              <ul className="absolute z-[100] w-full bg-white/95 backdrop-blur-xl border border-gray-200 mt-2 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {locationSuggestions.map((sug, index) => (
                  <li 
                    key={index} 
                    className="px-4 py-3 hover:bg-green-50 cursor-pointer border-b border-gray-100/50 text-sm text-gray-700 transition-colors"
                    onClick={() => handleSelectSuggestion(sug)}
                  >
                    <i className="fa-solid fa-map-pin text-green-500 mr-2 opacity-70"></i>
                    {sug.display_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {locationStatus && (
            <div className={`mt-4 px-4 py-2 rounded-lg bg-white/50 border border-white/60 ${locationStatusClass}`}>
              {locationStatus}
            </div>
          )}
        </div>

        {/* Budget & Tools Glass Panel */}
        <BudgetToolsForm onAnalysisComplete={handleAnalysisComplete} />

      </div>

      {/* Right Column: Sticky Map (60%) */}
      <div className="lg:w-3/5 relative map-wrapper animate-slide-in-right">
        <MapView />
      </div>
    </div>
    </>
  );
}
