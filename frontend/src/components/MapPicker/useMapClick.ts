import { useMapEvents } from "react-leaflet";
import type { Coordinates } from "./mapPicker.types";

export const useMapClick = (onChange: (coords: Coordinates) => void) => {
    useMapEvents({
        click(e) {
            onChange({ lat: e.latlng.lat, lng: e.latlng.wrap().lng });
        },
    });
};