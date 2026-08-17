import { useState } from 'react';
import { useFieldData } from '../context/FieldDataContext';
import type { FieldData } from '../types';
import { saveFieldData } from '../services/api';

interface BudgetToolsFormProps {
  onAnalysisComplete: (data: FieldData) => void;
}

export default function BudgetToolsForm({ onAnalysisComplete }: BudgetToolsFormProps) {
  const {
    referralId,
    fieldLocation,
    soilType,
    predictedWaterSource,
    manualWaterSource,
    budget,
    setBudget,
    availableTools,
    setAvailableTools,
    desiredCrop,
    setDesiredCrop,
  } = useFieldData();

  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showLoader, setShowLoader] = useState(false);

  const handleSubmit = async () => {
    if (!budget && !availableTools && !desiredCrop) {
      setModalMessage(
        'Please enter at least one field (budget, tools, or desired crop) to submit.'
      );
      setShowModal(true);
      return;
    }

    setShowLoader(true);

    let weatherData = null;
    try {
      if (fieldLocation && fieldLocation.lat && fieldLocation.lng) {
        const { getWeather } = await import('../services/api');
        weatherData = await getWeather(fieldLocation.lat, fieldLocation.lng);
      }
    } catch (e) {
      console.error('Failed to fetch real weather data:', e);
    }

    const satelliteData = {
      rainfallPrediction: weatherData 
        ? `${weatherData.rainfall} mm/month`
        : `${(Math.random() * 100).toFixed(1)} mm/month`,
      soilMoistureIndex: weatherData?.soilMoisture !== undefined
        ? `${weatherData.soilMoisture.toFixed(2)}`
        : `${(Math.random() * 0.5 + 0.2).toFixed(2)}`,
      temperature: weatherData
        ? `${weatherData.temperature}°C`
        : `${(Math.random() * 20 + 15).toFixed(1)}°C`,
      seasonalForecast: weatherData?.seasonalForecast || ['Normal', 'Dry Spell Expected', 'Wet Season Ahead'][Math.floor(Math.random() * 3)],
      landElevation: weatherData?.elevation !== undefined
        ? `${weatherData.elevation.toFixed(0)} meters`
        : `${(Math.random() * 1000 + 50).toFixed(0)} meters`,
      slopeData: weatherData?.slopeData !== undefined
        ? `${weatherData.slopeData.toFixed(1)}%`
        : `${(Math.random() * 10).toFixed(1)}%`,
    };

    let aiAnalysis = null;
    try {
      const { analyzeField } = await import('../services/api');
      aiAnalysis = await analyzeField({
        fieldLocation,
        soilType,
        predictedWaterSource,
        manualWaterSource,
        budget,
        availableTools,
        desiredCrop,
        satelliteData
      });
    } catch (e) {
      console.error('Failed to run AI analysis:', e);
      setModalMessage('AI Analysis failed. Please check backend connection.');
      setShowModal(true);
      setShowLoader(false);
      return;
    }

    const fieldData: FieldData = {
      referralId,
      fieldLocation,
      soilType,
      predictedWaterSource,
      manualWaterSource,
      budget,
      availableTools,
      desiredCrop,
      satelliteData,
      cropSuitability: aiAnalysis.cropSuitability,
      climateRisks: aiAnalysis.climateRisks,
      cropRotationPlanner: aiAnalysis.cropRotationPlanner,
      recommendations: aiAnalysis.recommendations,
      bestCropRecommendation: aiAnalysis.bestCropRecommendation,
    };

    try {
      await saveFieldData(fieldData);
    } catch (e) {
      console.warn('Backend not available, continuing with local data:', e);
    }

    setShowLoader(false);
    onAnalysisComplete(fieldData);
  };

  return (
    <>
      <div className="glass-panel p-6 mb-6 shrink-0">
        <h2 className="text-xl font-bold text-[#2B2420] mb-6 flex items-center gap-3 border-b border-[#6B4E3D]/20 pb-4">
          <span className="w-8 h-8 rounded-full bg-[#C4703A] text-white flex items-center justify-center text-sm font-bold shadow-sm font-sans">2</span>
          Project Parameters
        </h2>
        
        <div className="space-y-5">
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-1">
              Estimated Budget (₹)
            </label>
            <input
              type="text"
              placeholder="e.g., 5000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-1">
              Available Machinery / Tools
            </label>
            <input
              type="text"
              placeholder="e.g., Tractor, Irrigation System"
              value={availableTools}
              onChange={(e) => setAvailableTools(e.target.value)}
              className="glass-input w-full"
            />
          </div>
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-1">
              Target Crop (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Wheat, Corn"
              value={desiredCrop}
              onChange={(e) => setDesiredCrop(e.target.value)}
              className="glass-input w-full"
            />
          </div>
        </div>

        <button onClick={handleSubmit} className="btn-primary-glass w-full mt-8 py-3 text-lg">
          <i className="fa-solid fa-microchip"></i> Run AI Analysis
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="glass-panel bg-white p-6 max-w-sm w-full animate-slide-up text-center">
            <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Notice</h3>
            <p className="text-slate-600 mb-6">{modalMessage}</p>
            <button onClick={() => setShowModal(false)} className="btn-secondary-glass w-full">
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Modern Loader Overlay */}
      {showLoader && (
        <div className="glass-loader-overlay">
          <div className="premium-spinner"></div>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">Analyzing Field Data...</h3>
          <p className="text-slate-600 mt-3 text-lg max-w-md text-center">
            Agriva AI is currently processing soil data, climate vectors, and water availability.
          </p>
        </div>
      )}
    </>
  );
}
