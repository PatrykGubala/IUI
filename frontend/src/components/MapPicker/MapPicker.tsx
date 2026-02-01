import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Box } from "@chakra-ui/react";
import type { MapPickerProps } from "./mapPicker.types";
import { markerIcon } from "./leafletMarkerIcon";
import { useMapClick } from "./useMapClick";

const ClickHandler: React.FC<Pick<MapPickerProps, "onChange">> = ({ onChange }) => {
    useMapClick(onChange);
    return null;
};

export const MapPicker: React.FC<MapPickerProps> = ({ value, onChange }) => {
    const center = value ?? { lat: 52.2297, lng: 21.0122 };

    return (
        <Box w="full" borderRadius="xl">
            <MapContainer
                center={center}
                zoom={13}
                style={{ width: "100%", height: "300px", borderRadius: "12px" }}
                worldCopyJump
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />
                <ClickHandler onChange={onChange} />
                {value && <Marker position={value} icon={markerIcon} />}
            </MapContainer>
        </Box>
    );
};
