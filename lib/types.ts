export type CarbonStatus =
  | "Declared"
  | "Not Declared"
  | "Not Available"
  | "Not Comparable";

export interface CarbonStage {
  stage: string;
  status: CarbonStatus;
  indicator: string;
  citation: string;
  valueRaw?: string;
  valueNumber?: number;
  unit?: string;
}

export interface Product {
  id: string;
  parentProductId?: string;
  productName: { value: string; citation: string };
  manufacturer: { value: string; citation: string };
  epdRegistrationNumber: { value: string; citation: string };
  canonicalProductPage: string;
  rawSource: string;
  declaredUnit: { value: string; citation: string };
  compressiveStrength: {
    raw: string;
    citation: string;
    valueMpa: number;
  };
  manufacturingLocation: {
    raw: string;
    searchableText: string;
    citation: string;
  };
  lifecycleScope: { value: string; citation: string };
  carbon: CarbonStage[];
  comparabilityFlags: string[];
}

export interface LifecycleStageCount {
  stage: string;
  declaredCount: number;
  notDeclaredCount: number;
  notAvailableCount: number;
  notComparableCount: number;
}

export interface Facets {
  manufacturers: string[];
  compressiveStrengthClasses: Array<{
    raw: string;
    citation: string;
    valueMpa: number;
  }>;
  manufacturingLocations: Array<{
    raw: string;
    searchableText: string;
    citation: string;
  }>;
  lifecycleStages: LifecycleStageCount[];
}
