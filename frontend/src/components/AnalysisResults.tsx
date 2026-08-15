import { jsPDF } from 'jspdf';
import type { FieldData } from '../types';

interface AnalysisResultsProps {
  data: FieldData;
  onReset: () => void;
}

export default function AnalysisResults({ data, onReset }: AnalysisResultsProps) {
  const downloadPdf = () => {
    const doc = new jsPDF();
    let yOffset = 10;
    const margin = 10;
    const lineHeight = 7;
    const sectionSpacing = 10;
    const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;

    const addText = (text: string, x: number, y: number) => {
      const lines = doc.splitTextToSize(text, pageWidth - (x - margin));
      doc.text(lines, x, y);
      return y + lines.length * lineHeight;
    };

    const checkNewPage = (y: number) => {
      if (y > 270) {
        doc.addPage();
        return 10;
      }
      return y;
    };

    doc.setFontSize(18);
    doc.text('Agriva: Field Analysis Report', margin, yOffset);
    yOffset += sectionSpacing;

    doc.setFontSize(14);
    doc.text('Field Summary', margin, yOffset);
    yOffset += lineHeight;
    doc.setFontSize(12);
    yOffset = addText(`Referral ID: ${data.referralId || 'N/A'}`, margin, yOffset);
    yOffset = addText(
      `Field Location: ${data.fieldLocation ? `${data.fieldLocation.lat?.toFixed(4)}, ${data.fieldLocation.lng?.toFixed(4)}` : 'N/A'}`,
      margin,
      yOffset
    );
    yOffset = addText(`Detected Soil Type: ${data.soilType || 'N/A'}`, margin, yOffset);
    yOffset = addText(
      `Predicted Water Source: ${data.predictedWaterSource ? `${data.predictedWaterSource.type} (${data.predictedWaterSource.suitability})` : 'N/A'}`,
      margin,
      yOffset
    );
    yOffset = addText(
      `Manual Water Source: ${data.manualWaterSource ? `${data.manualWaterSource.type} (${data.manualWaterSource.suitability})` : 'N/A'}`,
      margin,
      yOffset
    );
    yOffset = addText(`Estimated Budget: ${data.budget ? `$${data.budget}` : 'N/A'}`, margin, yOffset);
    yOffset = addText(`Available Tools: ${data.availableTools || 'N/A'}`, margin, yOffset);
    yOffset = addText(`Desired Crop: ${data.desiredCrop || 'N/A'}`, margin, yOffset);
    yOffset += sectionSpacing;

    yOffset = checkNewPage(yOffset);
    doc.setFontSize(14);
    doc.text('Satellite Data & Forecasts', margin, yOffset);
    yOffset += lineHeight;
    doc.setFontSize(12);
    yOffset = addText(`Rainfall: ${data.satelliteData.rainfallPrediction}`, margin, yOffset);
    yOffset = addText(`Soil Moisture: ${data.satelliteData.soilMoistureIndex}`, margin, yOffset);
    yOffset = addText(`Temperature: ${data.satelliteData.temperature}`, margin, yOffset);
    yOffset = addText(`Seasonal Forecast: ${data.satelliteData.seasonalForecast}`, margin, yOffset);
    yOffset = addText(`Elevation: ${data.satelliteData.landElevation}`, margin, yOffset);
    yOffset = addText(`Slope: ${data.satelliteData.slopeData}`, margin, yOffset);
    yOffset += sectionSpacing;

    yOffset = checkNewPage(yOffset);
    doc.setFontSize(14);
    doc.text('Climate Risk Alerts', margin, yOffset);
    yOffset += lineHeight;
    doc.setFontSize(12);
    yOffset = addText(`Flood Risk: ${data.climateRisks.floodRisk}`, margin, yOffset);
    yOffset = addText(`Drought Risk: ${data.climateRisks.droughtRisk}`, margin, yOffset);
    yOffset += sectionSpacing;

    yOffset = checkNewPage(yOffset);
    doc.setFontSize(14);
    doc.text('Best Crop Recommendation', margin, yOffset);
    yOffset += lineHeight;
    doc.setFontSize(12);
    yOffset = addText(
      `Recommended: ${data.bestCropRecommendation.recommendedCrop}`,
      margin,
      yOffset
    );
    data.bestCropRecommendation.reasons.forEach((reason) => {
      yOffset = checkNewPage(yOffset);
      yOffset = addText(`- ${reason}`, margin + 5, yOffset);
    });
    yOffset += sectionSpacing;

    yOffset = checkNewPage(yOffset);
    doc.setFontSize(14);
    doc.text('Crop Rotation Planner', margin, yOffset);
    yOffset += lineHeight;
    doc.setFontSize(12);
    yOffset = addText(`Strategy: ${data.cropRotationPlanner.rotationStrategy}`, margin, yOffset);
    data.cropRotationPlanner.recommendedCrops.forEach((crop) => {
      yOffset = checkNewPage(yOffset);
      yOffset = addText(`- ${crop}`, margin + 5, yOffset);
    });

    const filename = `Agriva_Analysis_${data.referralId || 'Report'}.pdf`;
    doc.save(filename);
  };

  return (
    <div className="container mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full text-green-800">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-green-700 mb-6 text-center">
        Agriva Analysis Results
      </h1>
      <div className="space-y-6">
        {/* Field Summary */}
        <div className="bg-green-50 p-5 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-2xl font-bold text-green-700">Field Summary</h2>
            <button
              onClick={downloadPdf}
              className="btn-secondary flex items-center justify-center gap-2 px-4 py-2 text-sm"
            >
              <i className="fa-solid fa-file-pdf"></i>
              Download PDF
            </button>
          </div>
          <p><strong>Referral ID:</strong> <span className="font-semibold">{data.referralId}</span></p>
          <p><strong>Field Location:</strong> <span className="font-semibold">{data.fieldLocation ? `${data.fieldLocation.lat?.toFixed(4)}, ${data.fieldLocation.lng?.toFixed(4)}` : 'N/A'}</span></p>
          <p><strong>Detected Soil Type:</strong> <span className="font-semibold">{data.soilType}</span></p>
          <p><strong>Predicted Water Source:</strong> <span className="font-semibold">{`${data.predictedWaterSource.type} (${data.predictedWaterSource.suitability})`}</span></p>
          <p><strong>Manual Water Source:</strong> <span className="font-semibold">{data.manualWaterSource ? `${data.manualWaterSource.type} (${data.manualWaterSource.suitability})` : 'N/A'}</span></p>
          <p><strong>Estimated Budget:</strong> <span className="font-semibold">{data.budget ? `$${data.budget}` : 'N/A'}</span></p>
          <p><strong>Available Tools:</strong> <span className="font-semibold">{data.availableTools || 'N/A'}</span></p>
          <p><strong>Desired Crop:</strong> <span className="font-semibold">{data.desiredCrop || 'N/A'}</span></p>
        </div>

        {/* Satellite Data */}
        <div className="bg-green-50 p-5 rounded-lg border border-green-200">
          <h2 className="text-2xl font-bold text-green-700 mb-4">Satellite Data &amp; Forecasts</h2>
          <p><i className="fa-solid fa-cloud-showers-heavy mr-2"></i><strong>Rainfall Prediction:</strong> <span className="font-semibold">{data.satelliteData.rainfallPrediction}</span></p>
          <p><i className="fa-solid fa-water mr-2"></i><strong>Soil Moisture Index:</strong> <span className="font-semibold">{data.satelliteData.soilMoistureIndex}</span></p>
          <p><i className="fa-solid fa-temperature-half mr-2"></i><strong>Temperature:</strong> <span className="font-semibold">{data.satelliteData.temperature}</span></p>
          <p><i className="fa-solid fa-calendar-alt mr-2"></i><strong>Seasonal Forecast:</strong> <span className="font-semibold">{data.satelliteData.seasonalForecast}</span></p>
          <p><i className="fa-solid fa-mountain mr-2"></i><strong>Land Elevation:</strong> <span className="font-semibold">{data.satelliteData.landElevation}</span></p>
          <p><i className="fa-solid fa-angle-double-up mr-2"></i><strong>Slope Data:</strong> <span className="font-semibold">{data.satelliteData.slopeData}</span></p>
        </div>

        {/* Climate Risk Alerts */}
        <div className="bg-green-50 p-5 rounded-lg border border-green-200">
          <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation"></i> Climate Risk Alerts
          </h2>
          <p><i className="fa-solid fa-house-flood-water mr-2"></i><strong>Flood Risk:</strong> <span className="font-semibold">{data.climateRisks.floodRisk}</span></p>
          <p><i className="fa-solid fa-sun-plant-wilt mr-2"></i><strong>Drought Risk:</strong> <span className="font-semibold">{data.climateRisks.droughtRisk}</span></p>
          <p className="text-sm text-green-600 mt-2">
            These alerts are based on simulated climate models and satellite data for your selected field and crop.
          </p>
        </div>

        {/* Desired Crop Suitability */}
        <div className="bg-green-50 p-5 rounded-lg border border-green-200">
          <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-seedling"></i> Desired Crop Suitability Analysis
          </h2>
          <p><strong>Possibility of Growing {data.desiredCrop || 'Selected Crop'}:</strong> <span className="font-semibold">{data.cropSuitability.suitability}</span></p>
          <p className="mt-2"><strong>Reasons:</strong></p>
          <ul className="list-disc list-inside ml-4 text-green-600">
            {data.cropSuitability.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>

        {/* Best Crop Recommendation */}
        <div className="bg-green-50 p-5 rounded-lg border border-green-200">
          <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-hand-holding-seedling"></i> Best Crop Recommendation
          </h2>
          <p><strong>Recommended Crop:</strong> <span className="font-semibold">{data.bestCropRecommendation.recommendedCrop}</span></p>
          <p className="mt-2"><strong>Recommendation Reasons:</strong></p>
          <ul className="list-disc list-inside ml-4 text-green-600">
            {data.bestCropRecommendation.reasons.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>
        </div>

        {/* Crop Rotation Planner */}
        <div className="bg-green-50 p-5 rounded-lg border border-green-200">
          <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-rotate mr-2"></i> Crop Rotation Planner
          </h2>
          <p><strong>Rotation Strategy:</strong> <span className="font-semibold">{data.cropRotationPlanner.rotationStrategy}</span></p>
          <p className="mt-2"><strong>Recommended Crops for Rotation:</strong></p>
          <ul className="list-disc list-inside ml-4 text-green-600">
            {data.cropRotationPlanner.recommendedCrops.map((crop, i) => (
              <li key={i}>{crop}</li>
            ))}
          </ul>
          <p className="mt-2"><strong>Benefits:</strong></p>
          <ul className="list-disc list-inside ml-4 text-green-600">
            {data.cropRotationPlanner.benefits.map((benefit, i) => (
              <li key={i}>{benefit}</li>
            ))}
          </ul>
          <p className="text-sm text-green-600 mt-2">
            This plan aims to improve long-term soil health and optimize nutrient cycling.
          </p>
        </div>

        {/* Crop Planning Recommendations */}
        <div className="bg-green-50 p-5 rounded-lg border border-green-200">
          <h2 className="text-2xl font-bold text-green-700 mb-4">Crop Planning Recommendations</h2>
          <p><strong>Ideal Soil:</strong> <span className="font-semibold">{data.recommendations.idealSoil}</span></p>
          <p><strong>Ideal Water Source:</strong> <span className="font-semibold">{data.recommendations.idealWater}</span></p>
          <p><strong>Ideal Temperature Range:</strong> <span className="font-semibold">{data.recommendations.idealTemperature}</span></p>
          <p><strong>Optimal Growing Season:</strong> <span className="font-semibold">{data.recommendations.growingSeason}</span></p>
          <p><strong>Expected Yield:</strong> <span className="font-semibold">{data.recommendations.expectedYield}</span></p>
          <p><strong>Required Inputs:</strong> <span className="font-semibold">{data.recommendations.requiredInputs}</span></p>
        </div>

        <button onClick={onReset} className="btn-primary w-full mt-6">
          Start New Analysis
        </button>
      </div>
    </div>
  );
}
