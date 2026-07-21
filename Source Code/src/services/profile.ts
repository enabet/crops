import { api } from "./api";

export type UserProfile = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  country: string;
  district: string;
};

export type UpdateProfilePayload = {
  first_name: string;
  last_name: string;
  country: string;
  district: string;
};

export async function getProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>("/auth/me/");
  return response.data;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile> {
  const response = await api.patch<UserProfile>(
    "/auth/me/",
    payload,
  );

  return response.data;
}