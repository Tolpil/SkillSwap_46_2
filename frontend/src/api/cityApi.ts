import { request } from "./client";
import type { TId } from "../utils/types";

export interface ICity {
  id: TId;
  name: string;
  region: string;
}

export interface GetCitiesOptions {
  major?: boolean;
}

/** API: ПОИСК ГОРОДОВ (для выпадающего списка и фильтра на главной) */
export const getCities = (
  search?: string,
  options: GetCitiesOptions = {},
): Promise<ICity[]> => {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (options.major) {
    params.set("major", "true");
  }

  const qs = params.toString();
  return request<ICity[]>(`/cities${qs ? `?${qs}` : ""}`);
};