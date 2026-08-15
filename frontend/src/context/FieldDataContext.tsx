import React, { createContext, useContext, useState, useCallback } from 'react';
import type { FieldData, Coordinates, WaterSource } from '../types';

interface FieldDataContextType {
  referralId: string;
  fieldLocation: Coordinates | null;
  soilType: string;
  predictedWaterSource: WaterSource;
  manualWaterSource: WaterSource | null;
  budget: string;
  availableTools: string;
  desiredCrop: string;
  analysisData: FieldData | null;
  setReferralId: (id: string) => void;
  setFieldLocation: (coords: Coordinates) => void;
  setSoilType: (type: string) => void;
  setPredictedWaterSource: (source: WaterSource) => void;
  setManualWaterSource: (source: WaterSource | null) => void;
  setBudget: (budget: string) => void;
  setAvailableTools: (tools: string) => void;
  setDesiredCrop: (crop: string) => void;
  setAnalysisData: (data: FieldData | null) => void;
  generateReferralId: () => string;
  resetAll: () => void;
}

const defaultWaterSource: WaterSource = {
  type: 'N/A',
  suitability: 'N/A',
  coords: { lat: null, lng: null },
};

const FieldDataContext = createContext<FieldDataContextType | undefined>(undefined);

export function FieldDataProvider({ children }: { children: React.ReactNode }) {
  const [referralId, setReferralId] = useState<string>('Generating...');
  const [fieldLocation, setFieldLocation] = useState<Coordinates | null>(null);
  const [soilType, setSoilType] = useState<string>('N/A');
  const [predictedWaterSource, setPredictedWaterSource] =
    useState<WaterSource>(defaultWaterSource);
  const [manualWaterSource, setManualWaterSource] = useState<WaterSource | null>(null);
  const [budget, setBudget] = useState<string>('');
  const [availableTools, setAvailableTools] = useState<string>('');
  const [desiredCrop, setDesiredCrop] = useState<string>('');
  const [analysisData, setAnalysisData] = useState<FieldData | null>(null);

  const generateReferralId = useCallback(() => {
    const id = 'AGRO-' + crypto.randomUUID().substring(0, 8).toUpperCase();
    setReferralId(id);
    return id;
  }, []);

  const resetAll = useCallback(() => {
    setReferralId('Generating...');
    setFieldLocation(null);
    setSoilType('N/A');
    setPredictedWaterSource(defaultWaterSource);
    setManualWaterSource(null);
    setBudget('');
    setAvailableTools('');
    setDesiredCrop('');
    setAnalysisData(null);
  }, []);

  return (
    <FieldDataContext.Provider
      value={{
        referralId,
        fieldLocation,
        soilType,
        predictedWaterSource,
        manualWaterSource,
        budget,
        availableTools,
        desiredCrop,
        analysisData,
        setReferralId,
        setFieldLocation,
        setSoilType,
        setPredictedWaterSource,
        setManualWaterSource,
        setBudget,
        setAvailableTools,
        setDesiredCrop,
        setAnalysisData,
        generateReferralId,
        resetAll,
      }}
    >
      {children}
    </FieldDataContext.Provider>
  );
}

export function useFieldData(): FieldDataContextType {
  const context = useContext(FieldDataContext);
  if (!context) {
    throw new Error('useFieldData must be used within a FieldDataProvider');
  }
  return context;
}
