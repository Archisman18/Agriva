import { useState } from 'react';
import { getFieldData } from '../services/api';
import { useFieldData } from '../context/FieldDataContext';

interface RestoreIdModalProps {
  show: boolean;
  onClose: () => void;
}

export default function RestoreIdModal({ show, onClose }: RestoreIdModalProps) {
  const [fieldIdInput, setFieldIdInput] = useState('');
  const [status, setStatus] = useState('');
  const [statusClass, setStatusClass] = useState('');

  const {
    setReferralId,
    setFieldLocation,
    setSoilType,
    setPredictedWaterSource,
    setManualWaterSource,
    setBudget,
    setAvailableTools,
    setDesiredCrop,
  } = useFieldData();

  if (!show) return null;

  const handleRestore = async () => {
    if (!fieldIdInput.trim()) {
      setStatus('Please enter a Referral ID.');
      setStatusClass('text-sm text-red-500 mt-2 text-center');
      return;
    }

    setStatus('Restoring data...');
    setStatusClass('text-sm text-green-600 mt-2 text-center');

    try {
      const data = await getFieldData(fieldIdInput.trim());

      // Populate context with restored data
      setReferralId(data.referralId || '');
      if (data.fieldLocation) {
        setFieldLocation(data.fieldLocation);
        // Update map if available
        const updateMap = (window as unknown as Record<string, unknown>).__agriva_updateMap as
          | ((lat: number, lng: number) => void)
          | undefined;
        if (updateMap && data.fieldLocation.lat && data.fieldLocation.lng) {
          updateMap(data.fieldLocation.lat, data.fieldLocation.lng);
        }
      }
      setSoilType(data.soilType || 'N/A');
      if (data.predictedWaterSource) {
        setPredictedWaterSource(data.predictedWaterSource);
      }
      setManualWaterSource(data.manualWaterSource || null);
      setBudget(data.budget || '');
      setAvailableTools(data.availableTools || '');
      setDesiredCrop(data.desiredCrop || '');

      setStatus('Data restored successfully!');
      setStatusClass('text-sm text-green-500 mt-2 text-center');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error restoring document:', error);
      setStatus('No data found for this ID or backend unavailable.');
      setStatusClass('text-sm text-red-500 mt-2 text-center');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          &times;
        </button>
        <h3 className="text-2xl font-bold mb-4">Restore Field Data</h3>
        <p className="text-lg mb-4">Enter your field's Referral ID:</p>
        <input
          type="text"
          value={fieldIdInput}
          onChange={(e) => setFieldIdInput(e.target.value)}
          placeholder="e.g., AGRO-ABC12345"
          className="w-full rounded-lg border-green-500 focus:ring-green-300 focus:border-green-300 shadow-sm mb-4"
        />
        <button onClick={handleRestore} className="btn-primary w-full">
          Restore Data
        </button>
        {status && <p className={statusClass}>{status}</p>}
      </div>
    </div>
  );
}
