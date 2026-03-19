export const API_BASE = "https://gfxlab.vercel.app";

export function api(path: string) {
  return `${API_BASE}${path}`;
}