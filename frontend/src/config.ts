export const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export function apiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  if (!API_URL) {
    throw new Error("VITE_API_URL is required.");
  }
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function apiFetch<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(apiUrl(path), options);
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
    throw new Error("API returned non-JSON response. Check VITE_API_URL.");
  }

  return data as T;
}

export function assetUrl(src?: string | null) {
  if (!src) return "";
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  return apiUrl(src);
}
