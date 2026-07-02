"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";

const DEFINITIONS = [
  {
    status: "Not Declared",
    color: "bg-zinc-100 border-zinc-300 nd-hatch",
    description:
      "The manufacturer chose not to include this lifecycle stage in the EPD scope. It does NOT mean the impact is zero — it means it wasn't measured and reported here. You cannot add a 'Not Declared' cell to others as if it were zero.",
  },
  {
    status: "Not Available",
    color: "bg-amber-50 border-amber-300",
    description:
      "The EPD explicitly states this stage is not applicable (e.g. a concrete product has no meaningful operational energy use in stage B6), or the data was unavailable at the time of publication.",
  },
  {
    status: "Not Comparable",
    color: "bg-orange-50 border-orange-400",
    description:
      "This EPD covers multiple products or manufacturing plants in a single declaration. The result is an average or range that cannot be directly compared against a single-product, single-plant EPD.",
  },
];

const SCOPE_NOTE = `Each EPD declares a scope (e.g. "A1-A3 cradle-to-gate" or "A1-A3 + C + D"). 
Products with different scopes cannot be compared by headline total alone — a product that includes end-of-life (C stages) 
will appear to have a higher total than one that stops at A1-A3, even if it is actually lower-carbon.
Always compare stage by stage.`;

export function DataCaveatsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors group">
        <Info className="w-4 h-4 text-amber-500" />
        <span>Before you compare: understanding data gaps and scope differences</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
        )}
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-amber-900">
            What the status labels mean
          </h3>
          <div className="space-y-3">
            {DEFINITIONS.map((def) => (
              <div key={def.status} className="flex gap-3">
                <span
                  className={`mt-0.5 shrink-0 inline-block w-24 text-center rounded border px-2 py-0.5 text-xs font-medium text-zinc-600 ${def.color}`}
                >
                  {def.status}
                </span>
                <p className="text-sm text-amber-800 leading-snug">{def.description}</p>
              </div>
            ))}
          </div>

          <Separator className="bg-amber-200" />

          <div>
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              Comparing EPDs with different lifecycle scopes
            </h3>
            <p className="text-sm text-amber-800 whitespace-pre-line leading-relaxed">
              {SCOPE_NOTE}
            </p>
          </div>

          <Separator className="bg-amber-200" />

          <div>
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              Hallett Group — multi-product EPD
            </h3>
            <p className="text-sm text-amber-800">
              The Hallett Group EPD covers grades from 10 MPa to 80 MPa across five
              South Australia batching plants. Because A1-A3 values are not reported per
              grade, this product is shown in the grid with a warning and is excluded from
              the stage-by-stage comparison bars.
            </p>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
