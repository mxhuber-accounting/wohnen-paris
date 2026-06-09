export type RentRow = {
  pieces: number;
  meuble: boolean;
  epoque: string;
  ref: number;
  ref_maj: number;
  ref_min: number;
};

export type LoyerData = {
  geoJson: any; // fetched separately from /paris-arrondissements.geojson
  byArrondissement: Record<number, RentRow[]>;
  year: number;
};
