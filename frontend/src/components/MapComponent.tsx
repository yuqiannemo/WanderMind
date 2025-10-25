"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import type { Attraction, RouteStop } from '@/types';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const routeIcon = (order: number) => new L.DivIcon({
  className: 'custom-div-icon',
  html: `<div style="background: linear-gradient(135deg, #3b82f6, #a855f7); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">${order}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

interface MapComponentProps {
  attractions: Attraction[];
  route?: RouteStop[];
  onAttractionClick?: (attraction: Attraction) => void;
  center?: [number, number];
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  
  return null;
}

export default function MapComponent({
  attractions,
  route,
  onAttractionClick,
  center = [48.8566, 2.3522], // Default to Paris
}: MapComponentProps) {
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (attractions.length > 0 && attractions[0].coordinates) {
      // Auto-center on first attraction
    }
  }, [attractions]);

  const routePositions: [number, number][] = route
    ? route
        .sort((a, b) => a.order - b.order)
        .map((stop) => stop.attraction.coordinates!)
        .filter((coord) => coord !== undefined)
    : [];

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="w-full h-full rounded-xl"
      ref={mapRef}
    >
      <MapUpdater center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Route polyline */}
      {routePositions.length > 1 && (
        <Polyline
          positions={routePositions}
          color="#3b82f6"
          weight={4}
          opacity={0.7}
          dashArray="10, 10"
        />
      )}

      {/* Route markers (numbered) */}
      {route && route.map((stop) => {
        if (!stop.attraction.coordinates) return null;
        
        return (
          <Marker
            key={`route-${stop.attraction.id}`}
            position={stop.attraction.coordinates}
            icon={routeIcon(stop.order)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{stop.attraction.name}</h3>
                <p className="text-sm text-slate-600 mb-2">
                  {stop.attraction.description}
                </p>
                <div className="flex flex-col gap-1 text-xs text-slate-500">
                  <p>⏰ {stop.startTime} - {stop.endTime}</p>
                  <p>📍 Stop #{stop.order}</p>
                  {stop.travelTimeToNext && (
                    <p>🚗 {stop.travelTimeToNext} min to next stop</p>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Attraction markers (when no route) */}
      {!route && attractions.map((attraction) => {
        if (!attraction.coordinates) return null;
        
        return (
          <Marker
            key={attraction.id}
            position={attraction.coordinates}
            icon={attraction.selected ? selectedIcon : new L.Icon.Default()}
            eventHandlers={{
              click: () => onAttractionClick?.(attraction),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-lg">{attraction.name}</h3>
                <p className="text-sm text-slate-600 mb-2">
                  {attraction.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>⏱️ {attraction.duration_hr}h</span>
                  <span>•</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                    {attraction.category}
                  </span>
                </div>
                {onAttractionClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAttractionClick(attraction);
                    }}
                    className={`mt-2 w-full py-1 px-3 rounded-lg text-sm font-medium transition-colors ${
                      attraction.selected
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {attraction.selected ? 'Remove' : 'Add to Route'}
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
