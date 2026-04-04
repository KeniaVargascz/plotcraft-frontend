export type MarkerType =
  | 'CITY'
  | 'TOWN'
  | 'VILLAGE'
  | 'DUNGEON'
  | 'LANDMARK'
  | 'RUINS'
  | 'TEMPLE'
  | 'FORTRESS'
  | 'PORT'
  | 'MOUNTAIN'
  | 'FOREST'
  | 'CUSTOM';

export interface MapMarkerResponse {
  id: string;
  label: string;
  type: MarkerType;
  x: number;
  y: number;
  description: string | null;
  icon: string | null;
  color: string | null;
  location: { id: string; name: string; type: string } | null;
  wbEntry: { id: string; name: string; slug: string } | null;
  createdAt: string;
}
