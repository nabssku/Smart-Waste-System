'use client';

import React, { useEffect, useRef } from 'react';
import { Report, ReportStatus } from '@/lib/types';
import { STATUS_CONFIG, WASTE_TYPE_CONFIG } from '@/lib/utils';

interface WasteMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  interactive?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  reports?: Report[];
  onSelectReport?: (report: Report) => void;
  heightClass?: string;
}

const PIN_COLORS: Record<ReportStatus, string> = {
  pending: '#D97706',
  in_progress: '#2563EB',
  completed: '#059669',
  rejected: '#DC2626',
};

export default function WasteMap({
  latitude,
  longitude,
  zoom = 14,
  interactive = false,
  onLocationChange,
  reports,
  onSelectReport,
  heightClass = 'h-72',
}: WasteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const mainMarkerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!containerRef.current) return;
      const L = (await import('leaflet')).default;

      if (!isMounted || !containerRef.current) return;

      // Prevent duplicate initialization in React StrictMode
      if (mapInstanceRef.current) {
        return;
      }

      const map = L.map(containerRef.current, {
        center: [latitude || -6.2088, longitude || 106.8456],
        zoom,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);

      const createCustomIcon = (color: string) =>
        L.divIcon({
          className: 'custom-waste-pin',
          html: `<div style="
            width: 30px;
            height: 30px;
            background: ${color};
            border: 3px solid #ffffff;
            border-radius: 9999px 9999px 9999px 4px;
            transform: rotate(-45deg);
            box-shadow: 0 6px 14px rgba(0,0,0,0.28);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 8px; height: 8px; background: white; border-radius: 9999px;"></div>
          </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -28],
        });

      if (!reports || reports.length === 0) {
        const marker = L.marker([latitude, longitude], {
          draggable: interactive,
          icon: createCustomIcon('#107C41'),
        }).addTo(map);

        if (interactive && onLocationChange) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onLocationChange(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
          });

          map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            marker.setLatLng([lat, lng]);
            onLocationChange(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
          });
        }

        mainMarkerRef.current = marker;
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        mainMarkerRef.current = null;
        markersGroupRef.current = null;
      }
    };
  }, []);

  // Sync single marker position when latitude/longitude props change
  useEffect(() => {
    if (!mapInstanceRef.current || (reports && reports.length > 0)) return;
    if (mainMarkerRef.current) {
      mainMarkerRef.current.setLatLng([latitude, longitude]);
      mapInstanceRef.current.panTo([latitude, longitude], { animate: true });
    }
  }, [latitude, longitude, reports]);

  // Sync multi-report pins when `reports` prop changes
  useEffect(() => {
    async function renderReportMarkers() {
      if (!mapInstanceRef.current || !markersGroupRef.current || !reports) return;
      const L = (await import('leaflet')).default;
      const group = markersGroupRef.current;
      group.clearLayers();

      if (reports.length === 0) return;

      const bounds: Array<[number, number]> = [];

      reports.forEach((rep) => {
        if (!rep.latitude || !rep.longitude) return;
        const color = PIN_COLORS[rep.status] || '#107C41';
        const statusLabel = STATUS_CONFIG[rep.status]?.label || rep.status;
        const wasteLabel = WASTE_TYPE_CONFIG[rep.wasteType]?.shortLabel || rep.wasteType;

        const icon = L.divIcon({
          className: 'custom-waste-pin',
          html: `<div style="
            width: 26px;
            height: 26px;
            background: ${color};
            border: 2.5px solid #ffffff;
            border-radius: 9999px 9999px 9999px 4px;
            transform: rotate(-45deg);
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 7px; height: 7px; background: white; border-radius: 9999px;"></div>
          </div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -24],
        });

        const marker = L.marker([rep.latitude, rep.longitude], { icon });
        marker.bindPopup(`
          <div style="min-width: 190px; font-family: system-ui, sans-serif;">
            <div style="font-size: 11px; font-weight: 700; color: ${color}; text-transform: uppercase; margin-bottom: 2px;">
              ${statusLabel} • ${wasteLabel}
            </div>
            <div style="font-size: 13px; font-weight: 700; color: #0F1F18; margin-bottom: 4px;">
              ${rep.title}
            </div>
            <div style="font-size: 11px; color: #4A5D53;">
              ${rep.address || `${rep.latitude.toFixed(4)}, ${rep.longitude.toFixed(4)}`}
            </div>
          </div>
        `);

        if (onSelectReport) {
          marker.on('click', () => onSelectReport(rep));
        }

        marker.addTo(group);
        bounds.push([rep.latitude, rep.longitude]);
      });

      if (bounds.length > 1) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
      } else if (bounds.length === 1) {
        mapInstanceRef.current.setView(bounds[0], 14);
      }
    }

    renderReportMarkers();
  }, [reports, onSelectReport]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <div ref={containerRef} className={`w-full ${heightClass}`} />
      {interactive && (
        <div className="pointer-events-none absolute bottom-3 left-3 z-[20] rounded-lg bg-slate-900/85 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm shadow-sm">
          Klik peta atau geser pin hijau untuk menyesuaikan titik koordinat
        </div>
      )}
    </div>
  );
}
