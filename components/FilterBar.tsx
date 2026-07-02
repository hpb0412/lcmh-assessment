"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { allStates, strengthOptions } from "@/lib/data";

interface FilterBarProps {
  selectedStrengths: number[];
  selectedStates: string[];
  compareMode: boolean;
  onStrengthChange: (values: number[]) => void;
  onStateChange: (values: string[]) => void;
  onCompareModeChange: (value: boolean) => void;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
}

export function FilterBar({
  selectedStrengths,
  selectedStates,
  compareMode,
  onStrengthChange,
  onStateChange,
  onCompareModeChange,
  totalCount,
  filteredCount,
  selectedCount,
}: FilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Filters row */}
      <div className="flex flex-wrap items-start gap-6">
        {/* Strength filter */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Compressive Strength
          </span>
          <ToggleGroup
            value={selectedStrengths.map(String)}
            onValueChange={(vals) => onStrengthChange(vals.map(Number))}
            className="flex flex-wrap gap-1"
          >
            {strengthOptions.map((mpa) => (
              <ToggleGroupItem
                key={mpa}
                value={String(mpa)}
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2.5 rounded-full data-[state=on]:bg-zinc-900 data-[state=on]:text-white data-[state=on]:border-zinc-900"
              >
                {mpa} MPa
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Location filter */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Manufacturing Location
          </span>
          <ToggleGroup
            value={selectedStates}
            onValueChange={onStateChange}
            className="flex flex-wrap gap-1"
          >
            {allStates.map((state) => (
              <ToggleGroupItem
                key={state}
                value={state}
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2.5 rounded-full data-[state=on]:bg-zinc-900 data-[state=on]:text-white data-[state=on]:border-zinc-900"
              >
                {state}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Compare mode toggle */}
        <div className="flex flex-col justify-end gap-1.5 ml-auto">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Compare Mode
          </span>
          <div className="flex items-center gap-2">
            <Switch
              id="compare-mode"
              checked={compareMode}
              onCheckedChange={onCompareModeChange}
            />
            <Label htmlFor="compare-mode" className="text-sm text-zinc-600 cursor-pointer">
              Select up to 4 products
            </Label>
          </div>
        </div>
      </div>

      {/* Status summary */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <span>
          Showing{" "}
          <strong className="text-zinc-800">{filteredCount}</strong> of{" "}
          {totalCount} products
        </span>
        {(selectedStrengths.length > 0 || selectedStates.length > 0) && (
          <span className="text-zinc-400">
            (
            {[
              selectedStrengths.length > 0
                ? `${selectedStrengths.map((s) => `${s} MPa`).join(", ")}`
                : null,
              selectedStates.length > 0 ? selectedStates.join(", ") : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            )
          </span>
        )}
        {compareMode && selectedCount > 0 && (
          <span className="ml-auto text-zinc-700 font-medium">
            {selectedCount} selected
            {selectedCount < 2 && " — select at least 1 more to compare"}
          </span>
        )}
      </div>
    </div>
  );
}
