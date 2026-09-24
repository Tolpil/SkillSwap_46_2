import { request } from "./client";
import type { UploadResponse } from "../utils/types.ts";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 МБ
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const validateImageFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Поддерживаются только изображения: JPEG, PNG, WEBP, GIF";
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Файл слишком большой — максимум 2 МБ";
  }

  return null;
};

export const uploadImage = async (file: File): Promise<UploadResponse> => {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const formData = new FormData();
  formData.append("file", file);
  return await request("/files/upload", {
    method: "POST",
    body: formData,
  });
};