// lib/paywall.ts
export function hasPaid(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("coverlab_paid") === "true";
}

export function markPaid(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("coverlab_paid", "true");
}

export function clearPaid(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("coverlab_paid");
}