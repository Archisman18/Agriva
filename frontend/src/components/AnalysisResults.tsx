import { jsPDF } from 'jspdf';
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
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
    yOffset = addText(`Estimated Budget: ${data.budget ? `₹${data.budget}` : 'N/A'}`, margin, yOffset);
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
    <div className="container max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 w-full animate-slide-up">
      <div className="glass-panel p-5 sm:p-8 lg:p-10 mb-6 sm:mb-8 text-center relative overflow-hidden bg-gradient-to-b from-[#F7F3EA] to-[#ffffff]">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-[#D4A857] opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-[#2F5233] opacity-10 rounded-full blur-3xl"></div>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#2F5233] mb-2 sm:mb-4 font-serif">
          Agriva Intelligence Report
        </h1>
        <p className="text-[#6B4E3D] font-medium text-sm sm:text-base">Powered by AI & Satellite Data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Field Summary */}
        <div className="glass-panel p-4 sm:p-6 col-span-1 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2B2420] mb-1 sm:mb-2 font-serif">Field Overview</h2>
            <p className="text-[#6B4E3D] text-sm sm:text-base">ID: <span className="font-mono text-[#C4703A] font-semibold">{data.referralId}</span></p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto">
            <button onClick={downloadPdf} className="btn-secondary-glass flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-4 text-sm sm:text-base">
              <i className="fa-solid fa-file-pdf"></i> Download PDF
            </button>
            <button onClick={onReset} className="btn-primary-glass flex-1 md:flex-none flex items-center justify-center gap-2 py-2.5 px-4 text-sm sm:text-base">
              <i className="fa-solid fa-rotate-left"></i> New Analysis
            </button>
          </div>
        </div>

        {/* Inputs Summary */}
        <div className="glass-panel p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-[#2B2420] border-b border-[#6B4E3D]/20 pb-3 mb-4 font-serif">
            <i className="fa-solid fa-clipboard-list text-[#2F5233] mr-2"></i> Inputs
          </h3>
          <ul className="space-y-3 text-xs sm:text-sm text-[#6B4E3D]">
            <li><span className="font-semibold text-[#2B2420] block text-xs uppercase tracking-wider text-[#6B4E3D] mb-1">Location</span>{data.fieldLocation ? `${data.fieldLocation.lat?.toFixed(4)}, ${data.fieldLocation.lng?.toFixed(4)}` : 'N/A'}</li>
            <li><span className="font-semibold text-[#2B2420] block text-xs uppercase tracking-wider text-[#6B4E3D] mb-1">Budget</span>{data.budget ? `₹${data.budget}` : 'N/A'}</li>
            <li><span className="font-semibold text-[#2B2420] block text-xs uppercase tracking-wider text-[#6B4E3D] mb-1">Tools</span>{data.availableTools || 'N/A'}</li>
            <li><span className="font-semibold text-[#2B2420] block text-xs uppercase tracking-wider text-[#6B4E3D] mb-1">Target Crop</span>{data.desiredCrop || 'N/A'}</li>
          </ul>
        </div>

        {/* Detected Geography */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-[#2B2420] border-b border-[#6B4E3D]/20 pb-3 mb-4">
            <i className="fa-solid fa-earth-americas text-[#C4703A] mr-2"></i> Geography & Water
          </h3>
          <ul className="space-y-3 text-sm text-[#6B4E3D]">
            <li><span className="font-semibold text-[#2B2420] block text-xs uppercase tracking-wider text-[#6B4E3D] mb-1">Soil Type</span>{data.soilType}</li>
            <li><span className="font-semibold text-[#2B2420] block text-xs uppercase tracking-wider text-[#6B4E3D] mb-1">Predicted Water Source</span>{data.predictedWaterSource.type} <span className="text-xs ml-1 bg-[#F7F3EA] text-[#2F5233] px-2 py-0.5 border border-[#D4A857]/50 rounded-full">{data.predictedWaterSource.suitability}</span></li>
            <li><span className="font-semibold text-[#2B2420] block text-xs uppercase tracking-wider text-[#6B4E3D] mb-1">Manual Water Source</span>{data.manualWaterSource ? <>{data.manualWaterSource.type} <span className="text-xs ml-1 bg-[#F7F3EA] text-[#2F5233] border border-[#D4A857]/50 px-2 py-0.5 rounded-full">{data.manualWaterSource.suitability}</span></> : 'N/A'}</li>
          </ul>
        </div>

        {/* Satellite Data */}
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-[#2B2420] border-b border-[#6B4E3D]/20 pb-3 mb-4">
            <i className="fa-solid fa-satellite text-[#2F5233] mr-2"></i> Satellite Data
          </h3>
          <ul className="space-y-3 text-sm text-[#6B4E3D]">
            <li><span className="font-semibold text-[#2B2420] block text-xs uppercase tracking-wider text-[#6B4E3D] mb-1">Rainfall & Temp</span>{data.satelliteData.rainfallPrediction} | {data.satelliteData.temperature}</li>
            <li><span className="font-semibold text-[#2B2420] block text-xs uppercase tracking-wider text-[#6B4E3D] mb-1">Soil Moisture</span>{data.satelliteData.soilMoistureIndex}</li>
            <li><span className="font-semibold text-[#2B2420] block text-xs uppercase tracking-wider text-[#6B4E3D] mb-1">Elevation & Slope</span>{data.satelliteData.landElevation} | {data.satelliteData.slopeData}</li>
            <li><span className="font-semibold text-[#2B2420] block text-xs uppercase tracking-wider text-[#6B4E3D] mb-1">Seasonal Forecast</span>{data.satelliteData.seasonalForecast}</li>
          </ul>
        </div>

        {/* Climate Risk Alerts */}
        <div className="glass-panel p-6 col-span-1 md:col-span-2 lg:col-span-1 bg-[#F7F3EA] border-[#D4A857]/30">
          <h3 className="text-lg font-bold text-[#2B2420] border-b border-[#D4A857]/30 pb-3 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-triangle-exclamation text-[#C4703A]"></i> Climate Risks
          </h3>
          <div className="text-sm text-[#2B2420]">
            <ResponsiveContainer width="100%" height={100}>
              <BarChart layout="vertical" data={[
                { name: 'Flood', risk: data.climateRisks.floodRisk.toLowerCase().includes('high') ? 80 : data.climateRisks.floodRisk.toLowerCase().includes('low') ? 20 : 50 },
                { name: 'Drought', risk: data.climateRisks.droughtRisk.toLowerCase().includes('high') ? 80 : data.climateRisks.droughtRisk.toLowerCase().includes('low') ? 20 : 50 }
              ]} margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={60} axisLine={false} tickLine={false} style={{ fontSize: '13px', fill: '#6B4E3D', fontWeight: 600 }} />
                <Bar dataKey="risk" radius={[0, 4, 4, 0]} barSize={16}>
                  {[
                    { name: 'Flood', risk: data.climateRisks.floodRisk.toLowerCase().includes('high') ? 80 : data.climateRisks.floodRisk.toLowerCase().includes('low') ? 20 : 50 },
                    { name: 'Drought', risk: data.climateRisks.droughtRisk.toLowerCase().includes('high') ? 80 : data.climateRisks.droughtRisk.toLowerCase().includes('low') ? 20 : 50 }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.risk > 70 ? '#C4703A' : entry.risk > 40 ? '#D4A857' : '#2F5233'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 text-xs text-[#6B4E3D] leading-tight space-y-1">
              <p><strong>Flood:</strong> {data.climateRisks.floodRisk}</p>
              <p><strong>Drought:</strong> {data.climateRisks.droughtRisk}</p>
            </div>
          </div>
        </div>

        {/* Desired Crop Suitability */}
        <div className="glass-panel p-6 col-span-1 md:col-span-2 lg:col-span-2 flex flex-col sm:flex-row gap-6 items-center">
          <div className="flex-1 w-full">
            <h3 className="text-lg font-bold text-[#2B2420] border-b border-[#6B4E3D]/20 pb-3 mb-4">
              <i className="fa-solid fa-seedling text-[#2F5233] mr-2"></i> Target Crop Suitability
            </h3>
            <p className="mb-3 text-[#2B2420]">
              Suitability for <span className="font-bold">{data.desiredCrop || 'Selected Crop'}</span>: 
              <span className="ml-2 inline-block px-3 py-1 bg-[#F7F3EA] border border-[#D4A857]/50 rounded-full font-semibold text-[#6B4E3D]">{data.cropSuitability.suitability}</span>
            </p>
            <ul className="list-none space-y-2 text-sm text-[#6B4E3D]">
              {data.cropSuitability.reasons.map((reason, i) => (
                <li key={i} className="flex gap-2"><i className="fa-solid fa-check text-[#2F5233] mt-1"></i> <span>{reason}</span></li>
              ))}
            </ul>
          </div>
          <div className="w-32 h-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={12} 
                data={[{ name: 'Score', value: data.cropSuitability.suitability.toLowerCase().includes('high') ? 90 : data.cropSuitability.suitability.toLowerCase().includes('low') ? 30 : 65, fill: '#2F5233' }]} 
                startAngle={180} endAngle={0}
              >
                <RadialBar background={{ fill: '#e6dfd1' }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <p className="text-center -mt-8 font-bold text-[#2F5233]">
              {data.cropSuitability.suitability.toLowerCase().includes('high') ? 'High' : data.cropSuitability.suitability.toLowerCase().includes('low') ? 'Low' : 'Med'}
            </p>
          </div>
        </div>

        {/* Best Crop Recommendation */}
        <div className="glass-panel p-6 col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-[#F7F3EA] to-[#ffffff]">
          <h3 className="text-xl font-bold text-[#2F5233] border-b border-[#D4A857]/50 pb-3 mb-4 flex items-center gap-2">
            <i className="fa-solid fa-star text-[#D4A857]"></i> AI Top Recommendation
          </h3>
          <p className="mb-4 text-[#2B2420] text-lg">
            Recommended Crop: <span className="font-extrabold text-[#2F5233] text-2xl ml-2">{data.bestCropRecommendation.recommendedCrop}</span>
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <ul className="list-none space-y-3 text-sm text-[#6B4E3D]">
              {data.bestCropRecommendation.reasons.map((reason, i) => (
                <li key={i} className="flex gap-2 bg-[#ffffff] p-2 rounded-lg border border-[#D4A857]/30 shadow-sm"><i className="fa-solid fa-lightbulb text-[#D4A857] mt-0.5"></i> <span>{reason}</span></li>
              ))}
            </ul>
            <div className="bg-[#ffffff] p-4 rounded-xl border border-[#D4A857]/30 shadow-sm h-fit">
              <h4 className="font-bold text-[#2B2420] mb-2">Ideal Growing Conditions</h4>
              <ul className="space-y-1 text-sm text-[#6B4E3D]">
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
          <h3 className="text-lg font-bold text-[#2B2420] border-b border-[#6B4E3D]/20 pb-3 mb-4">
            <i className="fa-solid fa-rotate text-[#2F5233] mr-2"></i> Crop Rotation Strategy
          </h3>
          <p className="mb-4 font-semibold text-[#2B2420]">Strategy: <span className="text-[#2F5233]">{data.cropRotationPlanner.rotationStrategy}</span></p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-[#C4703A] mb-2 text-sm uppercase tracking-wider">Sequence</h4>
              <div className="flex flex-wrap gap-2">
                {data.cropRotationPlanner.recommendedCrops.map((crop, i) => (
                  <span key={i} className="px-3 py-1.5 bg-[#F7F3EA] text-[#2F5233] rounded-lg text-sm border border-[#D4A857]/50 font-medium">
                    {crop} {i < data.cropRotationPlanner.recommendedCrops.length - 1 && <i className="fa-solid fa-arrow-right ml-2 opacity-50"></i>}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-[#C4703A] mb-2 text-sm uppercase tracking-wider">Ecological Benefits</h4>
              <ul className="list-none space-y-2 text-sm text-[#6B4E3D]">
                {data.cropRotationPlanner.benefits.map((benefit, i) => (
                  <li key={i} className="flex gap-2"><i className="fa-solid fa-leaf text-[#2F5233] mt-1"></i> <span>{benefit}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
