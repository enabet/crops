import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import type { FarmMarker } from "../services/farms";

import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FitMarkers({ markers }: { markers: FarmMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (!markers.length) return;
    if (markers.length === 1) {
      map.setView([markers[0].latitude, markers[0].longitude], 14);
      return;
    }
    map.fitBounds(markers.map((farm) => [farm.latitude, farm.longitude] as [number, number]), {
      padding: [30, 30],
    });
  }, [map, markers]);
  return null;
}

export default function FarmMap({ markers }: { markers: FarmMarker[] }) {
  return (
    <div className="map-shell" aria-label="OpenStreetMap showing registered farms">
      <MapContainer center={[17.1899, -88.4976]} zoom={8} scrollWheelZoom className="farm-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMarkers markers={markers} />
        {markers.map((farm) => (
          <Marker key={farm.id} position={[farm.latitude, farm.longitude]} icon={markerIcon}>
            <Popup>
              <strong>{farm.name}</strong>
              <br />
              {farm.location_name || `${farm.district}, ${farm.country}`}
              <br />
              Area: {farm.area_hectares} ha
              <br />
              Soil: {farm.soil_type || "Not recorded"}
              <br />
              Water: {farm.water_source || "Not recorded"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
