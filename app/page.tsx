import { products } from "@/lib/data";
import { EpdExplorer } from "@/components/EpdExplorer";
import { DataCaveatsPanel } from "@/components/DataCaveatsPanel";

export default function Page() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-zinc-900 leading-tight">
              Concrete EPD Carbon Comparison
            </h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Compare embodied carbon across the full lifecycle — stage by
              stage, not just a headline number
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-xs text-zinc-400">
              {products.length} products · GWP-Total · per m³
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <DataCaveatsPanel />
        <EpdExplorer initialProducts={products} />
      </main>

      <footer className="border-t border-zinc-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <p className="text-xs text-zinc-400">
            Data sourced from Environmental Product Declarations (EPDs). All
            carbon values in kg CO₂e per m³ of concrete (GWP-Total indicator).
            Not declared ≠ zero. Compare stage scopes before drawing conclusions.
          </p>
        </div>
      </footer>
    </div>
  )
}
