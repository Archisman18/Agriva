import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { useFieldData } from '../context/FieldDataContext';
import type { PredictionData } from '../types';

export default function MapView() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fieldMarkerRef = useRef<L.Marker | null>(null);
  const predictedWaterMarkerRef = useRef<L.Marker | null>(null);
  const manualWaterMarkerRef = useRef<L.Marker | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const osmLayerRef = useRef<L.TileLayer | null>(null);
  const underwaterLayerRef = useRef<L.LayerGroup | null>(null);

  const [isSatelliteView, setIsSatelliteView] = useState(false);
  const [isManualSelectionMode, setIsManualSelectionMode] = useState(false);
  const [showMapSelectionModal, setShowMapSelectionModal] = useState(false);
  const [predictionInfo, setPredictionInfo] = useState<PredictionData | null>(null);

  const {
    fieldLocation,
    setFieldLocation,
    predictedWaterSource,
    setPredictedWaterSource,
    manualWaterSource,
    setManualWaterSource,
    setSoilType,
    generateReferralId,
    soilType
  } = useFieldData();

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([20, 0], 3);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;

      osmLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; OpenStreetMap',
        }
      ).addTo(map);

      satelliteLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '&copy; Esri',
        }
      );

      underwaterLayerRef.current = L.layerGroup().addTo(map);

      map.on('moveend', () => {
        if (isSatelliteView) {
          addPredictedUnderwaterLocations();
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isManualSelectionMode) {
        selectManualWaterSource(e.latlng.lat, e.latlng.lng);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isManualSelectionMode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMoveEnd = () => {
      if (isSatelliteView) {
        addPredictedUnderwaterLocations();
      }
    };

    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [isSatelliteView]);

  const determineSoilType = useCallback(
    async (lat: number, lng: number) => {
      setSoilType('Analyzing...');
      try {
        const { getSoilData } = await import('../services/api');
        const data = await getSoilData(lat, lng);
        setSoilType(data.soilType);
      } catch (error) {
        console.error('Failed to get soil data', error);
        setSoilType('Unknown (API Error)');
      }
    },
    [setSoilType]
  );

  const determinePredictedWaterSource = useCallback(
    async (lat: number, lng: number) => {
      try {
        const { getWaterSources } = await import('../services/api');
        const data = await getWaterSources(lat, lng);
        if (data && data.closest) {
          setPredictedWaterSource(data.closest);
          (window as any).__agriva_water_hotspots = data.hotspots;
        }
      } catch (error) {
        console.error('Failed to get water sources', error);
      }
    },
    [setPredictedWaterSource]
  );

  const updateMap = useCallback(
    (lat: number, lng: number) => {
      const map = mapRef.current;
      if (!map || isNaN(lat) || isNaN(lng)) return;

      const newLatLng = new L.LatLng(lat, lng);
      map.setView(newLatLng, 15);

      if (fieldMarkerRef.current) {
        fieldMarkerRef.current.setLatLng(newLatLng);
      } else {
        fieldMarkerRef.current = L.marker(newLatLng).addTo(map);
      }
      fieldMarkerRef.current
        .bindPopup(`<b>Field Location</b><br>${lat.toFixed(4)}, ${lng.toFixed(4)}`)
        .openPopup();

      setFieldLocation({ lat, lng });
      determineSoilType(lat, lng);
      determinePredictedWaterSource(lat, lng);
      generateReferralId();
    },
    [setFieldLocation, determineSoilType, determinePredictedWaterSource, generateReferralId]
  );

  const addPredictedUnderwaterLocations = () => {
    const map = mapRef.current;
    const layer = underwaterLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    
    const hotspots = (window as any).__agriva_water_hotspots || [];

    hotspots.forEach((spot: any) => {
      const circle = L.circleMarker([spot.coords.lat, spot.coords.lng], {
        color: '#00FFFF',
        fillColor: '#00FFFF',
        fillOpacity: 0.5,
        radius: 8,
      });
      circle.on('click', () => setPredictionInfo(spot));
      layer.addLayer(circle);
    });
  };

  const selectManualWaterSource = (lat: number, lng: number) => {
    setIsManualSelectionMode(false);
    if (mapRef.current) {
      mapRef.current.getContainer().style.cursor = '';
    }

    const waterSourceTypes = [
      'Manually Selected Source (River)',
      'Manually Selected Source (Lake)',
      'Manually Selected Source (Well)',
    ];
    const suitabilityOptions = ['Highly Suitable', 'Moderately Suitable', 'Not Recommended'];

    setManualWaterSource({
      type: waterSourceTypes[Math.floor(Math.random() * waterSourceTypes.length)],
      suitability: suitabilityOptions[Math.floor(Math.random() * suitabilityOptions.length)],
      coords: { lat, lng },
    });

    if (manualWaterMarkerRef.current) {
      manualWaterMarkerRef.current.setLatLng([lat, lng]);
    } else {
      manualWaterMarkerRef.current = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'custom-div-icon',
          html: '<i class="fa-solid fa-droplet text-blue-500 text-3xl" style="filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.3));"></i>',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        }),
      }).addTo(mapRef.current!);
    }
    manualWaterMarkerRef.current.bindPopup('<b>Manually Selected Source</b>').openPopup();
    setShowMapSelectionModal(false);
  };

  const toggleSatelliteView = () => {
    const map = mapRef.current;
    if (!map || !satelliteLayerRef.current || !osmLayerRef.current) return;

    if (isSatelliteView) {
      map.removeLayer(satelliteLayerRef.current);
      map.addLayer(osmLayerRef.current);
      underwaterLayerRef.current?.clearLayers();
      setPredictionInfo(null);
    } else {
      map.removeLayer(osmLayerRef.current);
      map.addLayer(satelliteLayerRef.current);
      addPredictedUnderwaterLocations();
    }
    setIsSatelliteView(!isSatelliteView);
    setIsManualSelectionMode(false);
    if (map) map.getContainer().style.cursor = '';
  };

  const goToWaterSource = (type: 'predicted' | 'manual') => {
    const map = mapRef.current;
    if (!map) return;

    const source = type === 'predicted' ? predictedWaterSource : manualWaterSource;
    if (!source || source.coords.lat === null || source.coords.lng === null) return;

    map.setView([source.coords.lat, source.coords.lng], 15);

    if (type === 'predicted') {
      if (predictedWaterMarkerRef.current) {
        predictedWaterMarkerRef.current.setLatLng([source.coords.lat, source.coords.lng]);
      } else {
        predictedWaterMarkerRef.current = L.marker([source.coords.lat, source.coords.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: '<i class="fa-solid fa-droplet text-blue-500 text-3xl" style="filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.3));"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          }),
        }).addTo(map);
      }
      predictedWaterMarkerRef.current.bindPopup('<b>Predicted Water Source</b>').openPopup();
    }
  };

  const enableManualSelection = () => {
    setIsManualSelectionMode(true);
    if (mapRef.current) {
      mapRef.current.getContainer().style.cursor = 'crosshair';
    }
    setShowMapSelectionModal(true);
  };

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__agriva_updateMap = updateMap;
    return () => {
      delete (window as unknown as Record<string, unknown>).__agriva_updateMap;
    };
  }, [updateMap]);

  return (
    <>
      <div id="map" ref={mapContainerRef}></div>

      {/* Top Left Overlay: Layer Controls */}
      <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2">
        <button
          onClick={toggleSatelliteView}
          className="bg-[#ffffff]/90 backdrop-blur-md p-3 rounded-xl shadow-lg border border-[#D4A857]/30 text-[#2B2420] hover:text-[#2F5233] transition-colors flex items-center justify-center"
          title="Toggle Satellite View"
        >
          <i className={`fa-sharp fa-solid ${isSatelliteView ? 'fa-map' : 'fa-satellite'} text-xl`}></i>
        </button>
      </div>

      {/* Top Right Overlay: Soil Analysis */}
      {fieldLocation && fieldLocation.lat && (
        <div className="map-overlay-panel map-overlay-top-right animate-slide-up" style={{ zIndex: 400 }}>
          <h3 className="text-lg font-bold text-[#2B2420] mb-2 flex items-center gap-2">
            <i className="fa-sharp fa-solid fa-leaf text-[#2F5233]"></i> Soil Analysis
          </h3>
          <p className="text-sm text-[#6B4E3D] mb-1">
            Detected Type: <span className="font-semibold text-[#C4703A]">{soilType}</span>
          </p>
          <p className="text-xs text-[#6B4E3D] opacity-80 leading-tight">
            Based on ISRIC SoilGrids multi-depth analysis for the selected coordinates.
          </p>
        </div>
      )}

      {/* Bottom Left Overlay: Water Sources */}
      {fieldLocation && fieldLocation.lat && (
        <div className="map-overlay-panel map-overlay-bottom-left animate-slide-up" style={{ zIndex: 400 }}>
          <h3 className="text-lg font-bold text-[#2B2420] mb-3 flex items-center gap-2">
            <i className="fa-sharp fa-solid fa-water text-[#C4703A]"></i> Water Sources
          </h3>
          
          <div className="mb-3 p-2 bg-[#F7F3EA]/60 rounded-lg">
            <p className="text-sm font-semibold text-[#2B2420] mb-1">Nearest Predicted</p>
            <p className="text-xs text-[#6B4E3D] truncate">{predictedWaterSource.type}</p>
            <button
              onClick={() => goToWaterSource('predicted')}
              className="text-xs text-[#2F5233] hover:text-[#C4703A] font-medium mt-1 flex items-center gap-1"
            >
              <i className="fa-solid fa-location-arrow"></i> View on Map
            </button>
          </div>

          <div className="p-2 bg-[#F7F3EA]/60 rounded-lg">
            <p className="text-sm font-semibold text-[#2B2420] mb-1">Manual Selection</p>
            {manualWaterSource ? (
              <>
                <p className="text-xs text-[#6B4E3D] truncate">{manualWaterSource.type}</p>
                <button
                  onClick={() => goToWaterSource('manual')}
                  className="text-xs text-[#2F5233] hover:text-[#C4703A] font-medium mt-1 flex items-center gap-1"
                >
                  <i className="fa-solid fa-location-arrow"></i> View on Map
                </button>
              </>
            ) : (
              <p className="text-xs text-[#6B4E3D] italic">No manual source selected.</p>
            )}
            <button
              onClick={enableManualSelection}
              className="text-xs bg-[#D4A857]/20 hover:bg-[#D4A857]/40 text-[#2B2420] px-2 py-1 rounded mt-2 transition-colors w-full text-left"
            >
              <i className="fa-solid fa-hand-pointer mr-1"></i> Select on Map
            </button>
          </div>
        </div>
      )}

      {/* Prediction Info Window (Overlay) */}
      {predictionInfo && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[500] glass-panel p-6 shadow-2xl min-w-[300px]">
          <button
            className="absolute top-4 right-4 text-[#6B4E3D] hover:text-[#C4703A] transition-colors"
            onClick={() => setPredictionInfo(null)}
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
          <h3 className="text-xl font-bold text-[#2B2420] mb-4 pr-6">Simulated Source Details</h3>
          <div className="space-y-2 text-sm text-[#6B4E3D]">
            <p><span className="font-semibold text-[#2B2420]">Type:</span> {predictionInfo.type}</p>
            <p><span className="font-semibold text-[#2B2420]">Volume:</span> {predictionInfo.volume}</p>
            <p><span className="font-semibold text-[#2B2420]">Quality:</span> {predictionInfo.quality}</p>
            <p><span className="font-semibold text-[#2B2420]">Depth:</span> {predictionInfo.depth}</p>
          </div>
        </div>
      )}

      {/* Map Selection Modal */}
      {showMapSelectionModal && (
        <div className="fixed inset-0 bg-[#2B2420]/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="glass-panel bg-[#F7F3EA]/95 p-6 sm:p-8 max-w-md w-full animate-slide-up">
            <h3 className="text-2xl font-bold text-[#2B2420] mb-3">Select Water Source</h3>
            <p className="text-[#6B4E3D] mb-6">Click anywhere on the interactive map to place a manual water source marker.</p>
            <button
              onClick={() => setShowMapSelectionModal(false)}
              className="btn-primary-glass w-full"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </>
  );
}
