// ===== Field Data Types =====

export interface Coordinates {
  lat: number | null;
  lng: number | null;
}

export interface WaterSource {
  type: string;
  suitability: string;
  coords: Coordinates;
}

export interface SatelliteData {
  rainfallPrediction: string;
  soilMoistureIndex: string;
  temperature: string;
  seasonalForecast: string;
  landElevation: string;
  slopeData: string;
}

export interface CropSuitabilityResult {
  suitability: string;
  reasons: string[];
}

export interface CropRecommendationResult {
  recommendedCrop: string;
  reasons: string[];
}

export interface ClimateRiskResult {
  floodRisk: string;
  droughtRisk: string;
}

export interface CropRotationResult {
  rotationStrategy: string;
  recommendedCrops: string[];
  benefits: string[];
}

export interface CropRecommendations {
  idealSoil: string;
  idealWater: string;
  idealTemperature: string;
  growingSeason: string;
  expectedYield: string;
  requiredInputs: string;
}

export interface FieldData {
  referralId?: string;
  fieldLocation: Coordinates | null;
  soilType: string;
  predictedWaterSource: WaterSource;
  manualWaterSource: WaterSource | null;
  budget: string;
  availableTools: string;
  desiredCrop: string;
  cropSuitability: CropSuitabilityResult;
  bestCropRecommendation: CropRecommendationResult;
  satelliteData: SatelliteData;
  climateRisks: ClimateRiskResult;
  cropRotationPlanner: CropRotationResult;
  recommendations: CropRecommendations;
}

// ===== Prediction / Underwater Types =====

export interface PredictionData {
  type: string;
  volume: string;
  quality: string;
  confidence: string;
  depth: string;
  flowRate: string;
  timeToExtract: string;
}

// ===== API Response Types =====

export interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
}

export interface WeatherResponse {
  temperature: number;
  humidity: number;
  rainfall: number;
  description: string;
  soilMoisture?: number;
  elevation?: number;
  seasonalForecast?: string;
  slopeData?: number;
}

export interface SoilResponse {
  soilType: string;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export interface PredictResponse {
  recommendedCrop: string;
  confidence: number;
  reasons: string[];
  featureImportance: Record<string, number>;
}

export interface RiskResponse {
  floodRisk: string;
  droughtRisk: string;
  overallScore: number;
}

export interface RotationResponse {
  rotationStrategy: string;
  recommendedCrops: string[];
  benefits: string[];
}

export interface AdvisorMessage {
  role: 'user' | 'assistant';
  content: string;
}
