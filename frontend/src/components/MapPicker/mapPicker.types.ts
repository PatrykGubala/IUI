export interface Coordinates {
    lat: number;
    lng: number;
}

export interface MapPickerProps {
    value: Coordinates | null;
    onChange: (coords: Coordinates) => void;
}