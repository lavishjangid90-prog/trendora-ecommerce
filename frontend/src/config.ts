const rawApiUrl = String(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").trim();
const useRelativeApiInProduction = !import.meta.env.DEV;

export const API_URL = useRelativeApiInProduction ? "" : rawApiUrl.replace(/\/+$/, "");

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!API_URL) return normalizedPath;
  return `${API_URL}${normalizedPath}`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message?: unknown }).message)
        : `API request failed (${response.status})`;
    throw new Error(message);
  }

  if (!isJson) {
    const preview = typeof data === "string" ? data.trim().slice(0, 80) : "";
    throw new Error(`API returned non-JSON response. Check VITE_API_URL.${preview ? ` Response started with: ${preview}` : ""}`);
  }

  return data as T;
}

export function assetUrl(src?: string | null) {
  if (!src) return "";
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  return apiUrl(src);
}
