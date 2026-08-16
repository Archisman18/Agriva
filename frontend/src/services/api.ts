import axios from 'axios';
import type {
  FieldData,
  GeocodingResult,
  WeatherResponse,
  SoilResponse,
  PredictResponse,
  RiskResponse,
  RotationResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== Field Data =====

export async function saveFieldData(data: FieldData): Promise<{ referralId: string }> {
  const response = await api.post('/field-data', data);
  return response.data;
}

export async function getFieldData(referralId: string): Promise<FieldData> {
  const response = await api.get(`/field-data/${referralId}`);
  return response.data;
}

// ===== Geocoding =====

export async function searchLocation(query: string): Promise<GeocodingResult[]> {
  const response = await api.get('/geocoding/search', { params: { q: query } });
  return response.data;
}

// ===== Weather =====

export async function getWeather(lat: number, lng: number): Promise<WeatherResponse> {
  const response = await api.get('/weather', { params: { lat, lng } });
  return response.data;
}

// ===== Soil =====

export async function getSoilData(lat: number, lng: number): Promise<SoilResponse> {
  const response = await api.get('/soil', { params: { lat, lng } });
  return response.data;
}

// ===== Water =====

export async function getWaterSources(lat: number, lng: number): Promise<any> {
  const response = await api.get('/water', { params: { lat, lng } });
  return response.data;
}

// ===== ML Predictions =====

export async function predictCrop(data: {
  soilType: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  budget: number;
}): Promise<PredictResponse> {
  const response = await api.post('/predict', data);
  return response.data;
}

export async function assessRisk(data: {
  rainfall: number;
  soilMoisture: number;
  seasonalForecast: string;
  elevation: number;
  slope: number;
  crop: string;
}): Promise<RiskResponse> {
  const response = await api.post('/risk', data);
  return response.data;
}

export async function getCropRotation(data: {
  currentCrop: string;
  soilType: string;
}): Promise<RotationResponse> {
  const response = await api.post('/rotation', data);
  return response.data;
}

// ===== Gemini AI Advisor =====

export async function analyzeField(data: any): Promise<any> {
  const response = await api.post('/analyze', data);
  return response.data;
}

export async function chatWithAdvisor(
  message: string,
  context: Partial<FieldData>,
  history: { role: string; content: string }[]
): Promise<{ reply: string }> {
  const response = await api.post('/advisor/chat', { message, context, history });
  return response.data;
}

export default api;
