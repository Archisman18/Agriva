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

// Mock functions have been replaced by the Groq AI /api/analyze endpoint

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

    // Try to save to backend
    try {
      await saveFieldData(fieldData);
    } catch (e) {
      console.warn('Backend not available, continuing with local data:', e);
    }

    // Simulate analysis time
    setTimeout(() => {
      setShowLoader(false);
      onAnalysisComplete(fieldData);
    }, 3000);
  };

  return (
    <>
      <div className="bg-green-50 p-5 rounded-lg border border-green-200">
        <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
          <i className="fa-sharp fa-solid fa-dollar-sign"></i> Budget, Tools &amp; Desired Crop
        </h2>
        <div className="mb-4">
          <label htmlFor="budget" className="block text-green-700 text-sm font-semibold mb-2">
            Estimated Budget ($):
          </label>
          <input
            type="text"
            id="budget"
            placeholder="e.g., 5000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full rounded-lg border-green-200 focus:ring-green-300 focus:border-green-300 shadow-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="availableTools" className="block text-green-700 text-sm font-semibold mb-2">
            Available Tools (comma-separated):
          </label>
          <input
            type="text"
            id="availableTools"
            placeholder="e.g., Tractor, Plow, Sprinkler"
            value={availableTools}
            onChange={(e) => setAvailableTools(e.target.value)}
            className="w-full rounded-lg border-green-200 focus:ring-green-300 focus:border-green-300 shadow-sm"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="desiredCrop" className="block text-green-700 text-sm font-semibold mb-2">
            Desired Crop (e.g., Wheat, Corn, Tomatoes):
          </label>
          <input
            type="text"
            id="desiredCrop"
            placeholder="e.g., Wheat"
            value={desiredCrop}
            onChange={(e) => setDesiredCrop(e.target.value)}
            className="w-full rounded-lg border-green-200 focus:ring-green-300 focus:border-green-300 shadow-sm"
          />
        </div>
        <button onClick={handleSubmit} className="btn-primary w-full">
          Submit Budget, Tools &amp; Crop
        </button>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowModal(false)}>
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-4">Submission Required</h3>
            <p className="text-sm text-green-200">{modalMessage}</p>
          </div>
        </div>
      )}

      {/* Analysis Loading Screen */}
      {showLoader && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="loader"></div>
            <h3 className="text-2xl font-bold mt-4">Analyzing Data...</h3>
            <p className="text-green-200 mt-2">
              Please wait while we process your field data with satellite insights.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
