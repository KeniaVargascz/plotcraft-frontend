export interface MapRegionResponse {
  id: string;
  label: string;
  color: string;
  borderColor: string;
  points: { x: number; y: number }[];
  description: string | null;
  createdAt: string;
}
