"use client";

import { AlertTriangle, CheckCircle2, MapPin, Zap, Plus, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/types";
import { getA1A3Value, hasComparabilityIssue, STATUS_CONFIG } from "@/lib/utils";
import { ALL_STAGES } from "@/lib/data";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  compareMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  canSelect: boolean;
  maxA1A3: number;
}

const DISPLAY_STAGES = ["A1-A3", "A4", "A5", "C1", "C2", "C3", "C4", "D"];

export function ProductCard({
  product,
  compareMode,
  isSelected,
  onSelect,
  canSelect,
  maxA1A3,
}: ProductCardProps) {
  const a1a3 = getA1A3Value(product);
  const hasIssue = hasComparabilityIssue(product);
  const barPercent = a1a3 !== null && maxA1A3 > 0 ? (a1a3 / maxA1A3) * 100 : 0;

  const handleSelect = () => {
    if (compareMode && (canSelect || isSelected)) {
      onSelect(product.id);
    }
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-white p-4 flex flex-col gap-3 transition-all duration-150",
        compareMode && canSelect ? "cursor-pointer hover:shadow-md" : "",
        compareMode && !canSelect && !isSelected
          ? "opacity-50 cursor-not-allowed"
          : "",
        isSelected
          ? "ring-2 ring-zinc-900 border-zinc-900 shadow-md"
          : "border-zinc-200 hover:border-zinc-300"
      )}
      onClick={handleSelect}
    >
      {/* Compare checkbox */}
      {compareMode && (
        <div
          className={cn(
            "absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
            isSelected
              ? "bg-zinc-900 border-zinc-900"
              : "bg-white border-zinc-300"
          )}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
        </div>
      )}

      {/* Header */}
      <div className="pr-7">
        <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-wide mb-0.5">
          {product.manufacturer.value}
        </p>
        <h3 className="text-sm font-semibold text-zinc-900 leading-snug">
          {product.productName.value}
        </h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          {product.epdRegistrationNumber.value}
        </p>
      </div>

      {/* Key attributes */}
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-xs gap-1 font-medium" title={product.compressiveStrength.raw}>
          <Zap className="w-3 h-3" />
          {product.compressiveStrength.raw}
        </Badge>
        <Badge variant="outline" className="text-xs gap-1 font-normal text-zinc-500" title={product.manufacturingLocation.raw}>
          <MapPin className="w-3 h-3" />
          {product.manufacturingLocation.raw.length > 38
            ? product.manufacturingLocation.raw.slice(0, 36) + "…"
            : product.manufacturingLocation.raw}
        </Badge>
      </div>

      {/* Comparability warning */}
      {hasIssue && (
        <div className="flex items-start gap-1.5 rounded-md bg-orange-50 border border-orange-200 px-2.5 py-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700 leading-snug">
            {product.comparabilityFlags[0] ||
              "Contains stages marked Not Comparable — see comparison table for details"}
          </p>
        </div>
      )}

      {/* A1-A3 bar */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-zinc-500 font-medium">
            A1-A3 Production carbon
          </span>
          {a1a3 !== null ? (
            <span className="text-sm font-bold text-zinc-900 tabular-nums">
              {a1a3.toFixed(1)}{" "}
              <span className="text-xs font-normal text-zinc-400">
                kg CO₂e / m³
              </span>
            </span>
          ) : (
            <span className="text-xs text-orange-600 font-medium">
              Not comparable
            </span>
          )}
        </div>
        <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
          {a1a3 !== null ? (
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${barPercent}%` }}
            />
          ) : (
            <div className="h-full w-full nd-hatch rounded-full" />
          )}
        </div>
      </div>

      {/* Stage coverage mini grid */}
      <div>
        <p className="text-[10px] text-zinc-400 uppercase tracking-wide mb-1.5">
          Stage coverage
        </p>
        <div className="grid grid-cols-8 gap-0.5">
          {DISPLAY_STAGES.map((stageName) => {
            const stage = product.carbon.find((c) => c.stage === stageName);
            const status = stage?.status ?? "Not Declared";
            const config = STATUS_CONFIG[status];
            return (
              <div
                key={stageName}
                className={`h-5 rounded text-[9px] flex items-center justify-center border font-medium select-none ${config.bgClass} ${config.borderClass} ${config.patternClass ?? ""} ${config.textClass}`}
                title={`${stageName}: ${status}${stage?.valueNumber !== undefined ? ` (${stage.valueNumber.toFixed(1)})` : ""}`}
              >
                {stageName === "A1-A3" ? "A1-3" : stageName}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scope label */}
      <p className="text-[10px] text-zinc-400 leading-snug mt-auto">
        <span className="font-medium text-zinc-500">Scope:</span>{" "}
        {product.lifecycleScope.value}
      </p>
    </div>
  );
}
