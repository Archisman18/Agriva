import { useState, useEffect, useRef } from 'react';
import { useFieldData } from '../context/FieldDataContext';
import MapView from '../components/MapView';
import BudgetToolsForm from '../components/BudgetToolsForm';
import AnalysisResults from '../components/AnalysisResults';
import RestoreIdModal from '../components/RestoreIdModal';
import { searchLocation } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import type { FieldData } from '../types';
import '../styles/app.css';

export default function AppPage() {
  const [showResults, setShowResults] = useState(false);
  const [analysisData, setAnalysisData] = useState<FieldData | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [locationStatusClass, setLocationStatusClass] = useState('');
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [manualLocationInput, setManualLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { referralId, generateReferralId } = useFieldData();
  const { getLocation } = useGeolocation();

  const callUpdateMap = (lat: number, lng: number) => {
    const updateMap = (window as unknown as Record<string, unknown>).__agriva_updateMap as
      | ((lat: number, lng: number) => void)
      | undefined;
    if (updateMap) {
      updateMap(lat, lng);
    }
  };

  const handleGpsLocation = () => {
    setLocationStatus('Getting your location...');
    setLocationStatusClass('text-sm text-green-600 mt-2 text-center');
    setShowManualCoords(false);

    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      setLocationStatusClass('text-sm text-red-500 mt-2 text-center');
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
        setLocationStatusClass('text-sm text-green-500 mt-2 text-center');
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
        setLocationStatusClass('text-sm text-red-500 mt-2 text-center');
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
      setLocationStatusClass('text-sm text-green-500 mt-2 text-center');
    } else {
      setLocationStatus('Please enter valid latitude and longitude.');
      setLocationStatusClass('text-sm text-red-500 mt-2 text-center');
    }
  };

  const handleManualLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setManualLocationInput(val);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (val.trim().length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchLocation(val);
        if (results && results.length > 0) {
          setLocationSuggestions(results);
          setShowSuggestions(true);
        } else {
          setLocationSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      }
    }, 200); // 200ms debounce
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setManualLocationInput(suggestion.display_name);
    setShowSuggestions(false);
    
    const lat = suggestion.lat;
    const lng = suggestion.lon;
    
    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
    callUpdateMap(lat, lng);
    
    setLocationStatus(`Location found: ${suggestion.display_name}`);
    setLocationStatusClass('text-sm text-green-500 mt-2 text-center');
  };

  const handleSearchLocation = async () => {
    if (!manualLocationInput) {
      setLocationStatus('Please enter a location name.');
      setLocationStatusClass('text-sm text-red-500 mt-2 text-center');
      return;
    }

    // If we have suggestions and user clicks search, just use the first one
    if (locationSuggestions.length > 0) {
      handleSelectSuggestion(locationSuggestions[0]);
      return;
    }

    setLocationStatus('Searching for location...');
    setLocationStatusClass('text-sm text-green-600 mt-2 text-center');

    try {
      const results = await searchLocation(manualLocationInput);
      if (results && results.length > 0) {
        handleSelectSuggestion(results[0]);
      } else {
        setLocationStatus('Location not found. Please try a different name.');
        setLocationStatusClass('text-sm text-red-500 mt-2 text-center');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setLocationStatus('Error searching location. Please try again.');
      setLocationStatusClass('text-sm text-red-500 mt-2 text-center');
    }
  };

  const handleAnalysisComplete = (data: FieldData) => {
    setAnalysisData(data);
    setShowResults(true);
  };

  const handleReset = () => {
    setShowResults(false);
    setAnalysisData(null);
    generateReferralId();
    window.location.reload();
  };

  const copyReferralId = () => {
    const tempInput = document.createElement('textarea');
    tempInput.value = referralId;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      setLocationStatus('Referral ID copied to clipboard!');
      setLocationStatusClass('text-sm text-green-500 mt-2 text-center');
    } catch {
      setLocationStatus('Failed to copy ID. Please copy manually.');
      setLocationStatusClass('text-sm text-red-500 mt-2 text-center');
    }
    document.body.removeChild(tempInput);
  };

  if (showResults && analysisData) {
    return (
      <div className="app-page-body flex items-center justify-center">
        <AnalysisResults data={analysisData} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div className="app-page-body flex items-center justify-center">
      <div className="app-container container mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full text-green-800">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-green-700 mb-6 text-center">
          Agriva: Empowering Smarter Farming Decisions
        </h1>

        <div className="space-y-6">
          {/* Agricultural Field Data Section */}
          <div className="bg-green-50 p-5 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-2xl font-bold text-green-700">Agricultural Field Data</h2>
              <div className="flex items-center gap-2 bg-green-100 p-2 rounded-lg border border-green-200">
                <i className="fa-sharp fa-solid fa-id-card-clip text-green-600 text-xl"></i>
                <p className="text-xl font-mono text-green-800 break-all">{referralId}</p>
                <button
                  onClick={copyReferralId}
                  className="btn-secondary p-1 rounded-md text-sm flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowRestoreModal(true)}
                  className="btn-secondary p-1 rounded-md text-sm flex items-center justify-center"
                >
                  <i className="fa-solid fa-plus text-green-600"></i>
                </button>
              </div>
            </div>

            {/* Location Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={handleGpsLocation}
                className="btn-primary flex-grow flex items-center justify-center gap-2"
              >
                <i className="fa-sharp fa-solid fa-location-dot"></i>
                Get GPS Location
              </button>
              <button
                onClick={() => setShowManualCoords(!showManualCoords)}
                className="btn-tertiary flex-grow flex items-center justify-center gap-2"
              >
                <i className="fa-sharp fa-solid fa-globe"></i>
                Enter Coordinates Manually
              </button>
            </div>

            {/* Manual Coordinate Input */}
            {showManualCoords && (
              <div className="space-y-4 mb-4">
                <div className="mb-4">
                  <label htmlFor="latitude" className="block text-green-700 text-sm font-semibold mb-2">
                    Latitude:
                  </label>
                  <input
                    type="text"
                    id="latitude"
                    placeholder="e.g., 30.0444"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    className="w-full rounded-lg border-green-200 focus:ring-green-300 focus:border-green-300 shadow-sm"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="longitude" className="block text-green-700 text-sm font-semibold mb-2">
                    Longitude:
                  </label>
                  <input
                    type="text"
                    id="longitude"
                    placeholder="e.g., 31.2357"
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    className="w-full rounded-lg border-green-200 focus:ring-green-300 focus:border-green-300 shadow-sm"
                  />
                </div>
                <button onClick={handleManualCoords} className="btn-primary w-full">
                  Apply Manual Coordinates
                </button>
              </div>
            )}

            {/* Manual Location Text Input */}
            <div className="mb-4 relative">
              <label htmlFor="manualLocation" className="block text-green-700 text-sm font-semibold mb-2">
                Or type your location (e.g., "Cairo, Egypt"):
              </label>
              <input
                type="text"
                id="manualLocation"
                placeholder="e.g., Nile Delta, Egypt"
                value={manualLocationInput}
                onChange={handleManualLocationChange}
                onFocus={() => {
                  if (locationSuggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay hiding suggestions to allow click events to fire
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                className="w-full rounded-lg border-green-200 focus:ring-green-300 focus:border-green-300 shadow-sm"
              />
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && locationSuggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white border border-green-200 mt-1 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {locationSuggestions.map((sug, index) => (
                    <li 
                      key={index} 
                      className="px-4 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100 text-sm text-gray-700"
                      onClick={() => handleSelectSuggestion(sug)}
                    >
                      {sug.display_name}
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={handleSearchLocation}
                className="btn-primary w-full mt-3"
              >
                <i className="fa-sharp fa-solid fa-magnifying-glass"></i> Search Location
              </button>
            </div>

            {locationStatus && <p className={locationStatusClass}>{locationStatus}</p>}
          </div>

          {/* Map + Soil + Water Source */}
          <MapView />

          {/* Budget, Tools & Desired Crop */}
          <BudgetToolsForm onAnalysisComplete={handleAnalysisComplete} />
        </div>
      </div>

      {/* Restore ID Modal */}
      <RestoreIdModal show={showRestoreModal} onClose={() => setShowRestoreModal(false)} />
    </div>
  );
}
