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

  const determineCropSuitability = (
    cropName: string,
    currentSoilType: string,
    waterSuitability: string,
    temperature: string
  ) => {
    if (!cropName) {
      return { suitability: 'N/A', reasons: ['Please enter a desired crop.'] };
    }

    let suitability = 'Uncertain';
    const reasons: string[] = [];

    if (
      currentSoilType === 'Loamy' &&
      waterSuitability === 'Highly Suitable' &&
      parseFloat(temperature) > 15 &&
      parseFloat(temperature) < 30
    ) {
      suitability = 'Highly Suitable';
      reasons.push('Optimal soil type and water source, with favorable temperature range.');
    } else if (currentSoilType === 'Sandy' && waterSuitability === 'Moderately Suitable') {
      suitability = 'Moderately Suitable';
      reasons.push(
        'Sandy soil may require more water retention strategies, but water source is adequate.'
      );
    } else {
      suitability = 'Not Recommended';
      reasons.push('Conditions are not ideal for this crop based on current data.');
    }

    if (Math.random() < 0.2) {
      if (suitability === 'Highly Suitable') suitability = 'Moderately Suitable';
      else if (suitability === 'Moderately Suitable') suitability = 'Highly Suitable';
    }
    if (reasons.length === 0) {
      reasons.push('General assessment based on simulated data.');
    }

    return { suitability, reasons };
  };

  const determineBestCropRecommendation = (
    fieldData: Partial<FieldData>,
    cropSuitability: { suitability: string; reasons: string[] }
  ) => {
    let recommendedCrop = 'General Crop';
    const reasons: string[] = [];

    if (fieldData.desiredCrop && cropSuitability.suitability !== 'Not Recommended') {
      recommendedCrop = fieldData.desiredCrop;
      reasons.push(
        `Your desired crop (${fieldData.desiredCrop}) is ${cropSuitability.suitability.toLowerCase()} for this field.`
      );
      reasons.push(...cropSuitability.reasons);
    } else if (fieldData.desiredCrop && cropSuitability.suitability === 'Not Recommended') {
      recommendedCrop = fieldData.desiredCrop;
      reasons.push(
        `Your desired crop (${fieldData.desiredCrop}) is ${cropSuitability.suitability.toLowerCase()} for this field due to:`
      );
      reasons.push(...cropSuitability.reasons);
      reasons.push('Considering other options might yield better results.');
    }

    if (
      recommendedCrop === 'General Crop' ||
      (fieldData.desiredCrop && cropSuitability.suitability === 'Not Recommended')
    ) {
      if (
        fieldData.soilType === 'Loamy' &&
        fieldData.predictedWaterSource?.suitability === 'Highly Suitable'
      ) {
        recommendedCrop = 'Wheat';
        reasons.push('Loamy soil and highly suitable water source are excellent for wheat.');
      } else if (fieldData.budget && parseFloat(fieldData.budget) > 10000) {
        recommendedCrop = 'Tomatoes';
        reasons.push(
          'Sufficient budget allows for investment in irrigation and pest control for tomatoes.'
        );
      } else {
        recommendedCrop = 'Corn';
        reasons.push(
          'Corn is a versatile crop suitable for a range of soil types and moderate water availability.'
        );
      }
    }

    if (Math.random() < 0.3) {
      reasons.push('Further analysis with real-time data could refine this recommendation.');
    }

    return { recommendedCrop, reasons };
  };

  const simulateClimateRisk = (
    rainfallPrediction: string,
    soilMoistureIndex: string,
    seasonalForecast: string,
    slopeData: string,
    crop: string
  ) => {
    let floodRisk = 'Low';
    let droughtRisk = 'Low';

    const rainfallValue = parseFloat(rainfallPrediction.split(' ')[0]);

    if (rainfallValue > 80 || seasonalForecast.includes('Wet Season')) {
      floodRisk = 'Medium';
    }
    if (rainfallValue > 150 || (seasonalForecast.includes('Wet Season') && parseFloat(slopeData) < 2)) {
      floodRisk = 'High';
    }

    const soilMoistureValue = parseFloat(soilMoistureIndex);
    if (soilMoistureValue < 0.3 || seasonalForecast.includes('Dry Spell')) {
      droughtRisk = 'Medium';
    }
    if (
      soilMoistureValue < 0.15 ||
      (seasonalForecast.includes('Dry Spell') && crop.toLowerCase().includes('wheat'))
    ) {
      droughtRisk = 'High';
    }

    return { floodRisk, droughtRisk };
  };

  const simulateCropRotation = (crop: string, currentSoilType: string) => {
    let rotationStrategy = 'Standard 3-Year Rotation';
    let recommendedCrops: string[] = [];
    let benefits: string[] = [];

    if (crop.toLowerCase().includes('wheat')) {
      rotationStrategy = 'Wheat-Legume-Fallow Rotation';
      recommendedCrops = ['Wheat', 'Alfalfa (Legume)', 'Corn'];
      benefits = [
        'Nitrogen fixation by legumes improves soil fertility.',
        'Disrupts pest and disease cycles specific to wheat.',
        'Improves soil structure and organic matter.',
      ];
    } else if (crop.toLowerCase().includes('corn')) {
      rotationStrategy = 'Corn-Soybean-Wheat Rotation';
      recommendedCrops = ['Corn', 'Soybean', 'Wheat'];
      benefits = [
        'Soybeans fix nitrogen, reducing fertilizer needs for corn.',
        'Diversifies root systems, improving soil aggregation.',
        'Reduces soil erosion and nutrient runoff.',
      ];
    } else if (crop.toLowerCase().includes('tomatoes')) {
      rotationStrategy = 'Vegetable-Cover Crop Rotation';
      recommendedCrops = ['Tomatoes', 'Cabbage', 'Clover (Cover Crop)'];
      benefits = [
        'Breaks disease cycles common to solanaceous crops.',
        'Cover crops suppress weeds and prevent nutrient leaching.',
        'Enhances soil biodiversity.',
      ];
    } else {
      rotationStrategy = 'General Diversified Rotation';
      recommendedCrops = [
        'Legumes (e.g., Beans)',
        'Root Vegetables (e.g., Carrots)',
        'Leafy Greens (e.g., Spinach)',
      ];
      benefits = [
        'Maintains soil fertility through diverse nutrient demands.',
        'Reduces reliance on a single crop, mitigating risk.',
        'Promotes a healthy soil microbiome.',
      ];
    }

    if (currentSoilType === 'Sandy') {
      benefits.push('Helps increase organic matter and water retention in sandy soils.');
    } else if (currentSoilType === 'Clayey') {
      benefits.push('Improves drainage and prevents compaction in clayey soils.');
    }

    return { rotationStrategy, recommendedCrops, benefits };
  };

  const handleSubmit = async () => {
    if (!budget && !availableTools && !desiredCrop) {
      setModalMessage(
        'Please enter at least one field (budget, tools, or desired crop) to submit.'
      );
      setShowModal(true);
      return;
    }

    setShowLoader(true);

    const satelliteData = {
      rainfallPrediction: `${(Math.random() * 100).toFixed(1)} mm/month`,
      soilMoistureIndex: `${(Math.random() * 0.5 + 0.2).toFixed(2)}`,
      temperature: `${(Math.random() * 20 + 15).toFixed(1)}°C`,
      seasonalForecast: ['Normal', 'Dry Spell Expected', 'Wet Season Ahead'][
        Math.floor(Math.random() * 3)
      ],
      landElevation: `${(Math.random() * 1000 + 50).toFixed(0)} meters`,
      slopeData: `${(Math.random() * 10).toFixed(1)}%`,
    };

    const cropSuitability = determineCropSuitability(
      desiredCrop,
      soilType,
      predictedWaterSource.suitability,
      satelliteData.temperature
    );

    const climateRisks = simulateClimateRisk(
      satelliteData.rainfallPrediction,
      satelliteData.soilMoistureIndex,
      satelliteData.seasonalForecast,
      satelliteData.slopeData,
      desiredCrop
    );

    const cropRotationPlanner = simulateCropRotation(desiredCrop, soilType);

    const fieldData: FieldData = {
      referralId,
      fieldLocation,
      soilType,
      predictedWaterSource,
      manualWaterSource,
      budget,
      availableTools,
      desiredCrop,
      cropSuitability,
      bestCropRecommendation: { recommendedCrop: '', reasons: [] },
      satelliteData,
      climateRisks,
      cropRotationPlanner,
      recommendations: {
        idealSoil: ['Loamy', 'Silty', 'Clay Loam'][Math.floor(Math.random() * 3)],
        idealWater: ['River Water', 'Rainwater Harvesting', 'Groundwater (Aquifer)'][
          Math.floor(Math.random() * 3)
        ],
        idealTemperature: `${(Math.random() * 10 + 20).toFixed(1)}-${(
          Math.random() * 5 + 30
        ).toFixed(1)}°C`,
        growingSeason: ['Spring-Summer', 'Autumn-Winter', 'Year-Round (with irrigation)'][
          Math.floor(Math.random() * 3)
        ],
        expectedYield: `${(Math.random() * 5 + 2).toFixed(1)} tons/hectare`,
        requiredInputs: ['Fertilizers', 'Pesticides', 'Improved Seeds', 'Irrigation System'][
          Math.floor(Math.random() * 4)
        ],
      },
    };

    const bestCropRecommendation = determineBestCropRecommendation(fieldData, cropSuitability);
    fieldData.bestCropRecommendation = bestCropRecommendation;

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
