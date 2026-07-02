"use client";

import { useState, useMemo } from "react";
import type { Product } from "@/lib/types";
import { getStateFromLocation } from "@/lib/data";
import { getA1A3Value } from "@/lib/utils";
import { FilterBar } from "@/components/FilterBar";
import { ProductCard } from "@/components/ProductCard";
import { ComparisonTable } from "@/components/ComparisonTable";
import { LegendBar } from "@/components/LegendBar";
import { TooltipProvider } from "@/components/ui/tooltip";

interface EpdExplorerProps {
  initialProducts: Product[];
}

const MAX_SELECTED = 4;

export function EpdExplorer({ initialProducts }: EpdExplorerProps) {
  const [selectedStrengths, setSelectedStrengths] = useState<number[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filtered products
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const strengthMatch =
        selectedStrengths.length === 0 ||
        selectedStrengths.includes(p.compressiveStrength.valueMpa);

      const productStates = getStateFromLocation(
        p.manufacturingLocation.searchableText
      );
      const stateMatch =
        selectedStates.length === 0 ||
        selectedStates.some((s) => productStates.includes(s));

      return strengthMatch && stateMatch;
    });
  }, [initialProducts, selectedStrengths, selectedStates]);

  // Selected products for comparison (preserving order of appearance in filteredProducts)
  const selectedProducts = useMemo(() => {
    return filteredProducts.filter((p) => selectedIds.has(p.id));
  }, [filteredProducts, selectedIds]);

  // Max A1-A3 across all products (for bar scaling in cards)
  const maxA1A3 = useMemo(() => {
    return Math.max(
      ...initialProducts
        .map((p) => getA1A3Value(p))
        .filter((v): v is number => v !== null),
      0
    );
  }, [initialProducts]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECTED) {
        next.add(id);
      }
      return next;
    });
  };

  const handleRemoveFromComparison = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleCompareModeChange = (value: boolean) => {
    setCompareMode(value);
    if (!value) setSelectedIds(new Set());
  };

  return (
    <TooltipProvider>
      {/* Legend */}
      <div className="bg-white rounded-xl border border-zinc-200 px-4 py-3">
        <LegendBar />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-zinc-200 px-4 py-4">
        <FilterBar
          selectedStrengths={selectedStrengths}
          selectedStates={selectedStates}
          compareMode={compareMode}
          onStrengthChange={setSelectedStrengths}
          onStateChange={setSelectedStates}
          onCompareModeChange={handleCompareModeChange}
          totalCount={initialProducts.length}
          filteredCount={filteredProducts.length}
          selectedCount={selectedIds.size}
        />
      </div>

      {/* Product grid */}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <p className="text-lg font-medium">No products match these filters</p>
          <p className="text-sm mt-1">Try removing a filter above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              compareMode={compareMode}
              isSelected={selectedIds.has(product.id)}
              onSelect={handleSelect}
              canSelect={selectedIds.size < MAX_SELECTED || selectedIds.has(product.id)}
              maxA1A3={maxA1A3}
            />
          ))}
        </div>
      )}

      {/* Comparison table */}
      {compareMode && selectedProducts.length >= 2 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-800">
              Stage-by-stage comparison
            </h2>
            <p className="text-xs text-blue-400">
              Hover non-declared cells for explanations · Lowest declared
              value per stage is highlighted
            </p>
          </div>
          <ComparisonTable
            products={selectedProducts}
            onRemove={handleRemoveFromComparison}
          />
        </div>
      )}

      {/* Prompt to select when compare mode on but nothing chosen */}
      {compareMode && selectedProducts.length < 2 && selectedProducts.length > 0 && (
        <div className="text-center py-8 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
          <p className="text-sm">
            Select <strong>{2 - selectedProducts.length}</strong> more
            product{2 - selectedProducts.length !== 1 ? "s" : ""} to see
            the comparison table
          </p>
        </div>
      )}

      {compareMode && selectedProducts.length === 0 && (
        <div className="text-center py-8 text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl">
          <p className="text-sm">
            Click any product card to add it to the comparison (up to{" "}
            {MAX_SELECTED})
          </p>
        </div>
      )}
    </TooltipProvider>
  );
}
