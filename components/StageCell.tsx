"use client";

import { AlertTriangle, Info } from "lucide-react";
import type { CarbonStage } from "@/lib/types";
import { STATUS_CONFIG, formatCarbon } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StageCellProps {
  stage: CarbonStage | undefined;
  stageName: string;
  maxValue?: number;
  isMin?: boolean;
}

export function StageCell({ stage, stageName, maxValue, isMin }: StageCellProps) {
  if (!stage) {
    return (
      <td className="px-3 py-2 text-center">
        <span className="text-zinc-300 text-xs">—</span>
      </td>
    );
  }

  const config = STATUS_CONFIG[stage.status];
  const isDeclared = stage.status === "Declared";
  const hasValue = isDeclared && stage.valueNumber !== undefined;

  return (
    <td
      className={`px-3 py-2 text-center border ${config.borderClass} ${config.bgClass} ${
        config.patternClass ?? ""
      } ${isMin && hasValue ? "ring-2 ring-emerald-400 ring-inset" : ""} relative`}
    >
      {hasValue ? (
        <div className="flex flex-col items-center gap-0.5">
          {/* Bar */}
          {maxValue && maxValue > 0 && (
            <div className="w-full h-1 bg-zinc-100 rounded overflow-hidden mb-1">
              <div
                className="h-full bg-emerald-400 rounded"
                style={{
                  width: `${Math.min(100, (Math.abs(stage.valueNumber!) / maxValue) * 100)}%`,
                  ...(stage.valueNumber! < 0 ? { background: "var(--color-nc)" } : {}),
                }}
              />
            </div>
          )}
          <span className={`text-sm font-semibold tabular-nums ${config.textClass}`}>
            {formatCarbon(stage.valueNumber!, stage.unit)}
          </span>
          {isMin && (
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide">
              lowest
            </span>
          )}
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger>
            <div className="flex flex-col items-center gap-0.5 cursor-help">
              <span className={`text-xs font-medium ${config.textClass}`}>
                {config.label}
              </span>
              {stage.status === "Not Declared" && (
                <Info className="w-3 h-3 text-zinc-400" />
              )}
              {stage.status === "Not Comparable" && (
                <AlertTriangle className="w-3 h-3 text-orange-500" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            {stage.status === "Not Declared" && (
              <p>
                <strong>Not declared</strong> means this stage was outside the
                declared scope of this EPD. It is <em>not</em> the same as zero
                — the impact may exist but was not measured here.
              </p>
            )}
            {stage.status === "Not Available" && (
              <p>
                <strong>Not available</strong> means the EPD explicitly states
                this stage is not applicable or data was unavailable at time of
                publication.
              </p>
            )}
            {stage.status === "Not Comparable" && (
              <p>
                <strong>Not comparable</strong> means this EPD covers multiple
                products or plant locations. A single value cannot be directly
                compared to single-product EPDs.
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      )}
    </td>
  );
}

/** Compact inline badge used in the product card mini table */
export function StageBadge({ stage }: { stage: CarbonStage }) {
  const config = STATUS_CONFIG[stage.status];
  const isDeclared = stage.status === "Declared" && stage.valueNumber !== undefined;

  return (
    <div
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs border ${config.bgClass} ${config.borderClass} ${config.patternClass ?? ""}`}
    >
      <span className={`font-medium ${config.textClass}`}>
        {isDeclared ? formatCarbon(stage.valueNumber!) : config.label}
      </span>
    </div>
  );
}
