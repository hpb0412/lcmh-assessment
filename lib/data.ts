import productsData from "@/data/products.json";
import facetsData from "@/data/facets.json";
import type { Product, Facets } from "./types";

export const products: Product[] = productsData as Product[];
export const facets: Facets = facetsData as Facets;

// Unique MPa values, sorted
export const strengthOptions: number[] = Array.from(
  new Set(products.map((p) => p.compressiveStrength.valueMpa))
).sort((a, b) => a - b);

// Derive state/region tokens from searchable location text
const statePatterns: { label: string; pattern: RegExp }[] = [
  { label: "SA", pattern: /south australia|burton|dry creek|gawler|gillman|littlehampton|lonsdale|murray bridge|sellicks|victor harbor|welland|mile end|mclaren vale|osborne|elizabeth/i },
  { label: "VIC", pattern: /victoria|melbourne|rockbank|salmon street|port melbourne/i },
  { label: "NSW", pattern: /nsw|new south wales|hunter valley/i },
  { label: "QLD", pattern: /queensland|brisbane|acacia ridge|beaudesert|beenleigh|geebung|narangba|wacol|murarrie|caboolture|brendale|raceview|toowoomba|warwick|caloundra|noosa|kawana|southport|tweed heads|coomera|boonah|darra|murgon|nanango|jacobs well|beerwah|gympie/i },
];

export function getStateFromLocation(searchableText: string): string[] {
  return statePatterns
    .filter(({ pattern }) => pattern.test(searchableText))
    .map(({ label }) => label);
}

export const allStates = ["SA", "VIC", "NSW", "QLD"];

// All lifecycle stages in display order
export const ALL_STAGES = [
  "A1-A3",
  "A4",
  "A5",
  "B1",
  "B2",
  "B3",
  "B4",
  "B5",
  "B6",
  "B7",
  "C1",
  "C2",
  "C3",
  "C4",
  "D",
];

export const STAGE_GROUPS: Record<string, string> = {
  "A1-A3": "Production",
  A4: "Transport to site",
  A5: "Installation",
  B1: "Use",
  B2: "Maintenance",
  B3: "Repair",
  B4: "Replacement",
  B5: "Refurbishment",
  B6: "Operational energy",
  B7: "Operational water",
  C1: "Deconstruction",
  C2: "Transport to EoL",
  C3: "Waste processing",
  C4: "Disposal",
  D: "Beyond boundary",
};
