'use client';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useEffect } from 'react';

interface Trade WyseMapProps {
  center: [number, number];
  zoom?: number;
  className?: string;
}

/**
 * @fileOverview A high-fidelity OpenStreetMap component for the Trade Wyse ecosystem.
 * Features a custom 'Gold and Slate' visual filter to match the brand standards.
 */

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function Trade WyseMap({ center, zoom = 13, className }: Trade WyseMapProps) {
  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="h-full w-full rounded-xl overflow-hidden"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="Trade Wyse-map-tiles"
        />
        <Marker position={center} />
        <ChangeView center={center} zoom={zoom} />
      </MapContainer>
      <style jsx global>{`
        /* Trade Wyse 'Gold and Slate' Map Filter */
        .Trade Wyse-map-tiles {
          filter: grayscale(100%) sepia(40%) invert(90%) brightness(0.9) contrast(1.1);
        }
        .leaflet-container {
          background: #0a0a0a !important;
        }
      `}</style>
    </div>
  );
}
