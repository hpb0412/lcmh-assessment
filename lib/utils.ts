import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CarbonStage, CarbonStatus, Product } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Returns the declared A1-A3 value for a product, or null if not declared/comparable */
export function getA1A3Value(product: Product): number | null {
  const stage = product.carbon.find((c) => c.stage === "A1-A3");
  if (!stage || stage.status !== "Declared" || stage.valueNumber === undefined) {
    return null;
  }
  return stage.valueNumber;
}

/** Sum of all *Declared* stage values for a product */
export function getDeclaredTotal(carbon: CarbonStage[]): number | null {
  const declared = carbon.filter(
    (c) => c.status === "Declared" && c.valueNumber !== undefined
  );
  if (declared.length === 0) return null;
  return declared.reduce((sum, c) => sum + (c.valueNumber ?? 0), 0);
}

/** Returns true if the product has any comparability issues */
export function hasComparabilityIssue(product: Product): boolean {
  return (
    product.comparabilityFlags.length > 0 ||
    product.carbon.some((c) => c.status === "Not Comparable")
  );
}

/** Colour + label config for each status */
export const STATUS_CONFIG: Record<
  CarbonStatus,
  { label: string; bgClass: string; textClass: string; borderClass: string; patternClass?: string }
> = {
  Declared: {
    label: "Declared",
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-800",
    borderClass: "border-emerald-200",
  },
  "Not Declared": {
    label: "Not declared",
    bgClass: "bg-zinc-100",
    textClass: "text-zinc-500",
    borderClass: "border-zinc-200",
    patternClass: "nd-hatch",
  },
  "Not Available": {
    label: "Not available",
    bgClass: "bg-amber-50",
    textClass: "text-amber-700",
    borderClass: "border-amber-200",
  },
  "Not Comparable": {
    label: "Not comparable",
    bgClass: "bg-orange-50",
    textClass: "text-orange-700",
    borderClass: "border-orange-300",
  },
};

/** Format a number to 1 decimal place with unit */
export function formatCarbon(value: number, unit?: string): string {
  const formatted = value === 0 ? "0" : value.toFixed(1);
  return unit ? `${formatted} ${unit}` : formatted;
}
