"use client";

const LEGEND_ITEMS = [
  {
    label: "Declared value",
    bg: "bg-emerald-100",
    border: "border-emerald-300",
    text: "text-emerald-700",
    pattern: false,
  },
  {
    label: "Not declared — not the same as zero",
    bg: "bg-zinc-100",
    border: "border-zinc-300",
    text: "text-zinc-500",
    pattern: true,
  },
  {
    label: "Not available in EPD",
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
    pattern: false,
  },
  {
    label: "Not directly comparable",
    bg: "bg-orange-50",
    border: "border-orange-400",
    text: "text-orange-700",
    pattern: false,
  },
];

export function LegendBar() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-600">
      <span className="font-medium text-zinc-400 uppercase tracking-wide text-[10px]">
        Legend:
      </span>
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className={`inline-block w-5 h-4 rounded border ${item.bg} ${item.border} ${
              item.pattern ? "nd-hatch" : ""
            }`}
            aria-hidden
          />
          <span className={item.text}>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
