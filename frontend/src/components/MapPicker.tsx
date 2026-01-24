import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {Box} from "@chakra-ui/react";

const markerIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapPickerProps {
    value: { lat: number; lng: number } | null;
    onChange: (coords: { lat: number; lng: number }) => void;
}

function ClickHandler({ onChange }: { onChange: MapPickerProps["onChange"] }) {
    useMapEvents({
        click(e) {
            console.log("raw latlng", e.latlng.lat, e.latlng.lng);
            onChange({ lat: e.latlng.lat, lng: e.latlng.wrap().lng });
        },
    });
    return null;
}

export const MapPicker: React.FC<MapPickerProps> = ({ value, onChange }) => {
    const center = value ?? { lat: 52.2297, lng: 21.0122 }; // Warszawa

    return (
        <Box w="full" borderRadius="x1" >
            <MapContainer
                center={center}
                zoom={13}
                style={{ width: "100%", height: "300px", borderRadius: "12px"}}
                worldCopyJump={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                />
                <ClickHandler onChange={onChange} />
                {value && <Marker position={value} icon={markerIcon} />}
            </MapContainer>
        </Box>

    );
};