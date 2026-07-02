"use client";

import { X, AlertTriangle } from "lucide-react";
import { StageCell } from "./StageCell";
import type { Product } from "@/lib/types";
import { ALL_STAGES, STAGE_GROUPS } from "@/lib/data";
import { hasComparabilityIssue } from "@/lib/utils";

interface ComparisonTableProps {
  products: Product[];
  onRemove: (id: string) => void;
}

// Stage group labels for row grouping
const STAGE_GROUP_LABELS: Record<string, string> = {
  "A1-A3": "A — Production & Transport",
  A4: "",
  A5: "",
  B1: "B — Use phase",
  B2: "",
  B3: "",
  B4: "",
  B5: "",
  B6: "",
  B7: "",
  C1: "C — End of life",
  C2: "",
  C3: "",
  C4: "",
  D: "D — Beyond system boundary",
};

function isGroupHeader(stage: string): boolean {
  return ["A1-A3", "B1", "C1", "D"].includes(stage);
}

export function ComparisonTable({ products, onRemove }: ComparisonTableProps) {
  if (products.length < 2) return null;

  // For each stage, compute max declared value across selected products (for bar scaling)
  const getMaxForStage = (stageName: string): number => {
    const values = products
      .map((p) => p.carbon.find((c) => c.stage === stageName))
      .filter((s) => s?.status === "Declared" && s.valueNumber !== undefined)
      .map((s) => Math.abs(s!.valueNumber!));
    return values.length ? Math.max(...values) : 0;
  };

  // For each stage, find the minimum declared value (to highlight lowest)
  const getMinProductId = (stageName: string): string | null => {
    let minVal = Infinity;
    let minId: string | null = null;
    for (const p of products) {
      const stage = p.carbon.find((c) => c.stage === stageName);
      if (stage?.status === "Declared" && stage.valueNumber !== undefined) {
        if (stage.valueNumber < minVal) {
          minVal = stage.valueNumber;
          minId = p.id;
        }
      }
    }
    // Only highlight min if there are at least 2 declared values
    const declaredCount = products.filter((p) => {
      const s = p.carbon.find((c) => c.stage === stageName);
      return s?.status === "Declared" && s.valueNumber !== undefined;
    }).length;
    return declaredCount >= 2 ? minId : null;
  };

  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          {/* Header */}
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="text-left px-4 py-3 w-44 font-semibold text-zinc-500 text-xs uppercase tracking-wide">
                Lifecycle Stage
              </th>
              {products.map((product) => (
                <th
                  key={product.id}
                  className="px-3 py-3 text-center min-w-[160px]"
                >
                  <div className="flex flex-col gap-1 items-center">
                    <div className="flex items-start justify-between w-full">
                      <div className="text-left flex-1">
                        <p className="text-[10px] text-zinc-400 font-normal leading-tight">
                          {product.manufacturer.value}
                        </p>
                        <p className="text-xs font-semibold text-zinc-900 leading-snug mt-0.5">
                          {product.productName.value}
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {product.compressiveStrength.raw} ·{" "}
                          {product.epdRegistrationNumber.value}
                        </p>
                      </div>
                      <button
                        onClick={() => onRemove(product.id)}
                        className="ml-2 p-0.5 rounded hover:bg-zinc-200 transition-colors shrink-0"
                        aria-label={`Remove ${product.productName.value} from comparison`}
                      >
                        <X className="w-3.5 h-3.5 text-zinc-400" />
                      </button>
                    </div>
                    {hasComparabilityIssue(product) && (
                      <div className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 w-full">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>Comparability issue</span>
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {ALL_STAGES.map((stageName) => {
              const maxVal = getMaxForStage(stageName);
              const minProductId = getMinProductId(stageName);
              const groupLabel = STAGE_GROUP_LABELS[stageName];

              return (
                <>
                  {/* Group header row */}
                  {isGroupHeader(stageName) && groupLabel && (
                    <tr key={`group-${stageName}`} className="bg-zinc-900">
                      <td
                        colSpan={products.length + 1}
                        className="px-4 py-1.5 text-[11px] font-bold text-zinc-200 uppercase tracking-wider"
                      >
                        {groupLabel}
                      </td>
                    </tr>
                  )}

                  {/* Stage row */}
                  <tr
                    key={stageName}
                    className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors"
                  >
                    {/* Stage label */}
                    <td className="px-4 py-2 align-middle">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-700">
                          {stageName}
                        </span>
                        <span className="text-[10px] text-zinc-400 leading-tight">
                          {STAGE_GROUPS[stageName]}
                        </span>
                      </div>
                    </td>

                    {/* Stage values per product */}
                    {products.map((product) => {
                      const stage = product.carbon.find(
                        (c) => c.stage === stageName
                      );
                      return (
                        <StageCell
                          key={product.id}
                          stage={stage}
                          stageName={stageName}
                          maxValue={maxVal}
                          isMin={minProductId === product.id}
                        />
                      );
                    })}
                  </tr>
                </>
              );
            })}
          </tbody>

          {/* Footer — comparability flags per product */}
          {products.some((p) => p.comparabilityFlags.length > 0) && (
            <tfoot>
              <tr className="bg-orange-50 border-t border-orange-200">
                <td className="px-4 py-2 text-[10px] font-semibold text-orange-700 uppercase tracking-wide">
                  Data notes
                </td>
                {products.map((product) => (
                  <td key={product.id} className="px-3 py-2 text-[10px] text-orange-700">
                    {product.comparabilityFlags.length > 0
                      ? product.comparabilityFlags.join("; ")
                      : "—"}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
