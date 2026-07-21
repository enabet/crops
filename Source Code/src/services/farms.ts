import { api } from "./api";

export type Farm = {
  id: number;
  owner_email?: string;
  name: string;
  location_name: string;
  country: string;
  district: string;
  area_hectares: string | number;
  soil_type: string;
  water_source: string;
  latitude: string | number | null;
  longitude: string | number | null;
  notes: string;
};

export type FarmInput = Omit<Farm, "id" | "owner_email">;

export type FarmMarker = {
  id: number;
  name: string;
  location_name: string;
  country: string;
  district: string;
  area_hectares: number;
  soil_type: string;
  water_source: string;
  latitude: number;
  longitude: number;
};

type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
};

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];

  if (data && typeof data === "object") {
    const results = (data as PaginatedResponse<T>).results;
    return Array.isArray(results) ? results : [];
  }

  return [];
}

export async function listFarms(): Promise<Farm[]> {
  const response = await api.get("/farms/farms/");
  return unwrapList<Farm>(response.data);
}

export async function listFarmMarkers(): Promise<FarmMarker[]> {
  const response = await api.get("/farms/farms/map-markers/");
  return unwrapList<FarmMarker>(response.data);
}

export async function createFarm(payload: FarmInput): Promise<Farm> {
  const response = await api.post("/farms/farms/", payload);
  return response.data as Farm;
}

export async function updateFarm(id: number, payload: Partial<FarmInput>): Promise<Farm> {
  const response = await api.patch(`/farms/farms/${id}/`, payload);
  return response.data as Farm;
}

export async function deleteFarm(id: number): Promise<void> {
  await api.delete(`/farms/farms/${id}/`);
}
