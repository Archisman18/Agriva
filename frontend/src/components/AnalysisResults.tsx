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
    <div className="container mx-auto p-4 sm:p-8 w-full animate-slide-up">
      <div className="glass-panel p-6 sm:p-10 mb-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-400 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-teal-400 opacity-20 rounded-full blur-3xl"></div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-600 mb-4">
          Agriva Intelligence Report
        </h1>
        <p className="text-slate-600 font-medium">Powered by Groq Llama 3.3 & Satellite Data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Field Summary */}
        <div className="glass-panel p-6 col-span-1 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Field Overview</h2>
            <p className="text-slate-600">ID: <span className="font-mono text-emerald-700 font-semibold">{data.referralId}</span></p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button onClick={downloadPdf} className="btn-secondary-glass flex-1 md:flex-none flex items-center justify-center gap-2">
              <i className="fa-solid fa-file-pdf"></i> Download PDF
            </button>
            <button onClick={onReset} className="btn-primary-glass flex-1 md:flex-none flex items-center justify-center gap-2">
              <i className="fa-solid fa-rotate-left"></i> New Analysis
            </button>
          </div>
        </div>

        {/* Inputs Summary */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200/50 pb-3 mb-4">
            <i className="fa-solid fa-clipboard-list text-emerald-600 mr-2"></i> Inputs
          </h3>
          <ul className="space-y-3 text-sm text-slate-700">
            <li><span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">Location</span>{data.fieldLocation ? `${data.fieldLocation.lat?.toFixed(4)}, ${data.fieldLocation.lng?.toFixed(4)}` : 'N/A'}</li>
            <li><span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">Budget</span>{data.budget ? `$${data.budget}` : 'N/A'}</li>
            <li><span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">Tools</span>{data.availableTools || 'N/A'}</li>
            <li><span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">Target Crop</span>{data.desiredCrop || 'N/A'}</li>
          </ul>
        </div>

        {/* Detected Geography */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200/50 pb-3 mb-4">
            <i className="fa-solid fa-earth-americas text-emerald-600 mr-2"></i> Geography & Water
          </h3>
          <ul className="space-y-3 text-sm text-slate-700">
            <li><span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">Soil Type</span>{data.soilType}</li>
            <li><span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">Predicted Water Source</span>{data.predictedWaterSource.type} <span className="text-xs ml-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 border border-emerald-200 rounded-full">{data.predictedWaterSource.suitability}</span></li>
            <li><span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">Manual Water Source</span>{data.manualWaterSource ? <>{data.manualWaterSource.type} <span className="text-xs ml-1 bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">{data.manualWaterSource.suitability}</span></> : 'N/A'}</li>
          </ul>
        </div>

        {/* Satellite Data */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200/50 pb-3 mb-4">
            <i className="fa-solid fa-satellite text-emerald-600 mr-2"></i> Satellite Data
          </h3>
          <ul className="space-y-3 text-sm text-slate-700">
            <li><span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">Rainfall & Temp</span>{data.satelliteData.rainfallPrediction} | {data.satelliteData.temperature}</li>
            <li><span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">Soil Moisture</span>{data.satelliteData.soilMoistureIndex}</li>
            <li><span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">Elevation & Slope</span>{data.satelliteData.landElevation} | {data.satelliteData.slopeData}</li>
            <li><span className="font-semibold text-slate-900 block text-xs uppercase tracking-wider text-slate-500 mb-1">Seasonal Forecast</span>{data.satelliteData.seasonalForecast}</li>
          </ul>
        </div>

        {/* Climate Risk Alerts */}
        <div className="glass-panel p-6 col-span-1 md:col-span-2 lg:col-span-1 bg-red-50 border-red-200">
          <h3 className="text-lg font-bold text-red-800 border-b border-red-200/50 pb-3 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation"></i> Climate Risks
          </h3>
          <div className="space-y-3 text-sm text-slate-700">
            <p><i className="fa-solid fa-house-flood-water text-red-500 w-5"></i> <strong>Flood:</strong> {data.climateRisks.floodRisk}</p>
            <p><i className="fa-solid fa-sun-plant-wilt text-orange-500 w-5"></i> <strong>Drought:</strong> {data.climateRisks.droughtRisk}</p>
          </div>
        </div>

        {/* Desired Crop Suitability */}
        <div className="glass-panel p-6 col-span-1 md:col-span-2 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200/50 pb-3 mb-4">
            <i className="fa-solid fa-seedling text-emerald-600 mr-2"></i> Target Crop Suitability
          </h3>
          <p className="mb-3 text-slate-800">
            Suitability for <span className="font-bold">{data.desiredCrop || 'Selected Crop'}</span>: 
            <span className="ml-2 inline-block px-3 py-1 bg-white border border-slate-200 rounded-full font-semibold">{data.cropSuitability.suitability}</span>
          </p>
          <ul className="list-none space-y-2 text-sm text-slate-600">
            {data.cropSuitability.reasons.map((reason, i) => (
              <li key={i} className="flex gap-2"><i className="fa-solid fa-check text-emerald-600 mt-1"></i> <span>{reason}</span></li>
            ))}
          </ul>
        </div>

        {/* Best Crop Recommendation */}
        <div className="glass-panel p-6 col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-emerald-50 to-teal-50">
          <h3 className="text-xl font-bold text-emerald-900 border-b border-emerald-200 pb-3 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-star text-emerald-600"></i> AI Top Recommendation
          </h3>
          <p className="mb-4 text-slate-800 text-lg">
            Recommended Crop: <span className="font-extrabold text-emerald-700 text-2xl ml-2">{data.bestCropRecommendation.recommendedCrop}</span>
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="list-none space-y-3 text-sm text-slate-700">
              {data.bestCropRecommendation.reasons.map((reason, i) => (
                <li key={i} className="flex gap-2 bg-white p-2 rounded-lg border border-emerald-100 shadow-sm"><i className="fa-solid fa-lightbulb text-emerald-500 mt-0.5"></i> <span>{reason}</span></li>
              ))}
            </ul>
            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm h-fit">
              <h4 className="font-bold text-slate-800 mb-2">Ideal Growing Conditions</h4>
              <ul className="space-y-1 text-sm text-slate-600">
                <li><strong>Soil:</strong> {data.recommendations.idealSoil}</li>
                <li><strong>Water:</strong> {data.recommendations.idealWater}</li>
                <li><strong>Temp:</strong> {data.recommendations.idealTemperature}</li>
                <li><strong>Season:</strong> {data.recommendations.growingSeason}</li>
                <li><strong>Yield:</strong> {data.recommendations.expectedYield}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Crop Rotation Planner */}
        <div className="glass-panel p-6 col-span-1 md:col-span-2 lg:col-span-3">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-200/50 pb-3 mb-4">
            <i className="fa-solid fa-rotate text-emerald-600 mr-2"></i> Crop Rotation Strategy
          </h3>
          <p className="mb-4 font-semibold text-slate-800">Strategy: <span className="text-emerald-700">{data.cropRotationPlanner.rotationStrategy}</span></p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wider">Sequence</h4>
              <div className="flex flex-wrap gap-2">
                {data.cropRotationPlanner.recommendedCrops.map((crop, i) => (
                  <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-sm border border-emerald-200 font-medium">
                    {crop} {i < data.cropRotationPlanner.recommendedCrops.length - 1 && <i className="fa-solid fa-arrow-right ml-2 opacity-50"></i>}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wider">Ecological Benefits</h4>
              <ul className="list-none space-y-2 text-sm text-slate-600">
                {data.cropRotationPlanner.benefits.map((benefit, i) => (
                  <li key={i} className="flex gap-2"><i className="fa-solid fa-leaf text-emerald-600 mt-1"></i> <span>{benefit}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
