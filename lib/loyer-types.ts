export type City = 'paris' | 'lyon';

export type RentRow = {
  pieces: number;
  meuble: boolean;
  ref: number;
  ref_maj: number;
  ref_min: number;
};

export type LoyerData = {
  city: City;
  geoJson: any;
  byZone: Record<number, RentRow[]>;
  year: string;
};

// Paris arrondissement (1-20) → DRIHL rent zone (1-14)
export const PARIS_ARR_TO_ZONE: Record<number, number> = {
  1: 2,  2: 4,  3: 4,  4: 2,  5: 4,
  6: 2,  7: 1,  8: 2,  9: 5,  10: 5,
  11: 11, 12: 14, 13: 10, 14: 5, 15: 7,
  16: 3, 17: 6, 18: 9, 19: 13, 20: 13,
};

export const CITY_CONFIG: Record<City, {
  label: string;
  geoJsonPath: string;
  center: [number, number];
  zoom: number;
  year: string;
  zoneLabel: string;
}> = {
  paris: {
    label: 'Paris',
    geoJsonPath: '/paris-zones.json',
    center: [48.8566, 2.3522],
    zoom: 12,
    year: '2025',
    zoneLabel: 'quartier',
  },
  lyon: {
    label: 'Lyon & Villeurbanne',
    geoJsonPath: '/lyon-zones.json',
    center: [45.7597, 4.8422],
    zoom: 12,
    year: '2025-2026',
    zoneLabel: 'commune',
  },
};
