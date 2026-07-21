import { api } from "./api";

export type CropCategory = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  crop_count: number;
};

export type Crop = {
  id: number;
  category: number;
  category_name: string;
  name: string;
  scientific_name: string;
  common_names: string[];
  description: string;
  origin: string;
  image_url: string;
  growing_duration_days: number | null;
  water_requirement: "low" | "medium" | "high";
  sunlight_requirement: string;
  soil_types: string[];
  planting_notes: string;
  fertilizer_recommendations: string;
  pest_management: string;
  harvest_guidance: string;
  nutritional_info: string;
  primary_uses: string[];
};

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function listCrops(params?: {
  search?: string;
  category?: string;
  water?: string;
  page?: number;
}): Promise<PaginatedResponse<Crop> | Crop[]> {
  const response = await api.get("/crops/crops/", { params });
  return response.data;
}

export async function getCrop(id: string | number): Promise<Crop> {
  const response = await api.get(`/crops/crops/${id}/`);
  return response.data;
}

export async function listCropCategories(): Promise<PaginatedResponse<CropCategory> | CropCategory[]> {
  const response = await api.get("/crops/categories/");
  return response.data;
}
