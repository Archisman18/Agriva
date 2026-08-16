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
  } = useFieldData();

  // Initialize map
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView([0, 0], 2);
      mapRef.current = map;

      osmLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }
      ).addTo(map);

      satelliteLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community',
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle manual selection mode map click
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManualSelectionMode]);

  // Satellite view moveend handler
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          
          // Store hotspots for map display later
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
        .bindPopup(`Field Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
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

    const addPoint = (spot: any) => {
      const circle = L.circleMarker([spot.coords.lat, spot.coords.lng], {
        color: '#00FFFF',
        fillColor: '#00FFFF',
        fillOpacity: 0.5,
        radius: 8,
      });
      circle.on('click', () => setPredictionInfo(spot));
      layer.addLayer(circle);
    };

    hotspots.forEach((spot: any) => {
      addPoint(spot);
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
          html: '<i class="fa-solid fa-droplet text-green-400 text-2xl"></i>',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        }),
      }).addTo(mapRef.current!);
    }
    manualWaterMarkerRef.current.bindPopup('Manually Selected Water Source').openPopup();
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
            html: '<i class="fa-solid fa-droplet text-green-400 text-2xl"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          }),
        }).addTo(map);
      }
      predictedWaterMarkerRef.current.bindPopup('Predicted Water Source').openPopup();
    }
  };

  const enableManualSelection = () => {
    setIsManualSelectionMode(true);
    if (mapRef.current) {
      mapRef.current.getContainer().style.cursor = 'crosshair';
    }
    setShowMapSelectionModal(true);
  };

  // Expose updateMap for parent component
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__agriva_updateMap = updateMap;
    return () => {
      delete (window as unknown as Record<string, unknown>).__agriva_updateMap;
    };
  }, [updateMap]);

  return (
    <>
      {/* Map Display */}
      <div className="bg-green-50 p-5 rounded-lg border border-green-200">
        <h2 className="text-2xl font-bold text-green-700 mb-4">Field Location Map</h2>
        <div className="flex flex-col lg:flex-row gap-4 items-start mb-4">
          <div id="map" ref={mapContainerRef} className="rounded-lg w-full lg:w-3/5"></div>
          {/* Prediction Info Window */}
          {predictionInfo && (
            <div
              id="predictionInfoWindow"
              className="w-full lg:w-2/5"
              style={{ display: 'flex' }}
            >
              <button
                className="close-btn"
                onClick={() => setPredictionInfo(null)}
              >
                &times;
              </button>
              <h3 className="text-lg font-bold mb-2">Predicted Underwater Source</h3>
              <p>Type: <span>{predictionInfo.type}</span></p>
              <p>Volume: <span>{predictionInfo.volume}</span></p>
              <p>Quality: <span>{predictionInfo.quality}</span></p>
              <p>Confidence: <span>{predictionInfo.confidence}</span></p>
              <p>Depth: <span>{predictionInfo.depth}</span></p>
              <p>Flow Rate: <span>{predictionInfo.flowRate}</span></p>
              <p>Time to Extract: <span>{predictionInfo.timeToExtract}</span></p>
              <p className="text-sm text-green-200 mt-2">
                This is a simulated prediction based on satellite data analysis.
              </p>
            </div>
          )}
        </div>
        <button
          onClick={toggleSatelliteView}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          <i className="fa-sharp fa-solid fa-satellite"></i>
          Toggle Satellite View &amp; Underwater Predictions
        </button>
      </div>

      {/* Soil Analysis Section */}
      <div className="bg-green-50 p-5 rounded-lg border border-green-200">
        <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
          <i className="fa-sharp fa-solid fa-leaf"></i> Soil Analysis
        </h2>
        <p>
          Detected Soil Type:{' '}
          <span className="font-semibold">{useFieldData().soilType}</span>
        </p>
        <p className="text-sm text-green-600 mt-2">
          Soil type is determined based on satellite spectral analysis of the selected field.
        </p>
        <div className="mt-4">
          <h3 className="text-lg font-bold text-green-700 mb-2">
            Closest Water Source (Predicted)
          </h3>
          <p>
            Source Type:{' '}
            <span className="font-semibold">{predictedWaterSource.type}</span>
          </p>
          <p>
            Suitable for Agriculture:{' '}
            <span className="font-semibold">{predictedWaterSource.suitability}</span>
          </p>
          <button
            onClick={() => goToWaterSource('predicted')}
            className="btn-secondary w-full mt-3 flex items-center justify-center gap-2"
          >
            <i className="fa-sharp fa-solid fa-map-marker-alt"></i> View Predicted Source on Map
          </button>
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-bold text-green-700 mb-2">Manually Selected Water Source</h3>
          <p>
            Source Type:{' '}
            <span className="font-semibold">{manualWaterSource?.type || 'N/A'}</span>
          </p>
          <p>
            Suitable for Agriculture:{' '}
            <span className="font-semibold">{manualWaterSource?.suitability || 'N/A'}</span>
          </p>
          <button
            onClick={enableManualSelection}
            className="btn-secondary w-full mt-3 flex items-center justify-center gap-2"
          >
            <i className="fa-sharp fa-solid fa-hand-pointer"></i> Select Source Manually on Map
          </button>
          {manualWaterSource && (
            <button
              onClick={() => goToWaterSource('manual')}
              className="btn-secondary w-full mt-3 flex items-center justify-center gap-2"
            >
              <i className="fa-sharp fa-solid fa-map-marker-alt"></i> View Manually Selected Source
            </button>
          )}
        </div>
      </div>

      {/* Map Selection Modal */}
      {showMapSelectionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={() => setShowMapSelectionModal(false)}>
              &times;
            </button>
            <h3 className="text-2xl font-bold mb-4">Select Water Source on Map</h3>
            <p className="text-lg mb-4">Click anywhere on the map to select the water source.</p>
            <p className="text-sm text-green-200">
              A marker will be placed at your selected location.
            </p>
            <button
              onClick={() => setShowMapSelectionModal(false)}
              className="btn-primary w-full mt-4"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </>
  );
}
