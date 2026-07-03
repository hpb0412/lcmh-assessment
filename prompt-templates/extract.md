Follow the repository `AGENTS.md` rules exactly:
- Never modify `raw/*.md`.
- Preserve visible source provenance for every extracted factual value.
- Treat `Not Declared`, `MND`, `NR`, unreadable, or unavailable lifecycle stages as
missing/status values, never as zero.
- Do not calculate, convert, round, or normalize source values except for separate helper
fields used for filtering/sorting.

Never modify the `wiki/**/*.*`

Store all generated extraction outputs in `../data`.

If `../data` does not exist, create it.

Task: Extract an efficient app-ready JSON from the wiki for an app that compares concrete products by embodied carbon stage by stage.

This app must support:
- Comparing concrete products by lifecycle stage, not just A1-A3.
- Filtering by compressive strength and manufacturing location.
- Showing where data is missing, not declared, unavailable, or not directly comparable.
- Hard rule: every carbon figure must retain traceability to its source EPD.

Please inspect the current wiki before extracting:
- `wiki/index.md`
- `wiki/products/index.md`
- canonical product pages under `wiki/products/*.md`
- strength, facility, lifecycle, and comparison relationship pages where useful
- compact product/plant or variant matrix pages, especially when an EPD declares multiple products, strengths, facilities, or plant-specific carbon results

Generate at least these files:

1. `products.json`

One product-oriented record per comparable concrete product.

Recommended shape:

```ts
type ProductCarbonRecord = {
  id: string;
  parentProductId?: string;
  productName: ProvenancedText;
  manufacturer: ProvenancedText;
  epdRegistrationNumber: ProvenancedText;
  canonicalProductPage: string;
  rawSource: string;
  declaredUnit: ProvenancedText;
  compressiveStrength: {
    raw: string;
    valueMpa?: number;
    citation: string;
  };
  manufacturingLocation: {
    raw: string;
    searchableText: string;
    citation: string;
  };
  lifecycleScope: ProvenancedText;
  carbon: StageCarbon[];
  comparabilityFlags: string[];
};

type ProvenancedText = {
  value: string;
  citation: string;
};

type StageCarbon = {
  stage:
    | "A1-A3"
    | "A4"
    | "A5"
    | "B1"
    | "B2"
    | "B3"
    | "B4"
    | "B5"
    | "B6"
    | "B7"
    | "C1"
    | "C2"
    | "C3"
    | "C4"
    | "D";
  status: "Declared" | "Not Declared" | "Not Available" | "Not Comparable";
  indicator: "GWP-Total";
  valueRaw?: string;
  valueNumber?: number;
  unit?: string;
  citation: string;
};

Extraction rules:

- Use each canonical product page’s Product Snapshot for identity metadata.
- Use the Primary Environmental Indicators table’s GWP-Total row for stage-by-stage carbon
where present.

- One app product record must represent one comparable concrete product at one manufacturing location with one declared carbon value. If a canonical EPD is an aggregate covering multiple products, plants, strengths, or variants, do not emit the aggregate as a normal comparable product.

- For multi-product EPDs, flatten every confidently aligned cited matrix row into a child product record. Use a stable id based on parent, product/mix code, variant, and facility or batching plant, and set `parentProductId` to the aggregate canonical product id.

- Child records should inherit manufacturer, EPD registration number, declared unit, lifecycle scope, canonicalProductPage, and rawSource from the aggregate canonical page, while using row-specific productName, compressiveStrength, manufacturingLocation, carbon value, and citations from the matrix row.

- Exclude or mark non-comparable only rows that lack a stable numeric carbon value, lack a specific strength/location needed for filtering, or are marked `Needs manual confirmation`. Preserve those rows in the wiki but do not invent app-comparable records for them.

- Use wiki/lifecycle-modules/module_declarations.md to fill declared/not-declared stage
status where numeric stage values are absent.

- Preserve source units exactly as written.
- Add valueNumber only when parsing is straightforward from the raw source string, and keep
valueRaw as the display value.

- For grouped products with no extractable cited variant matrix, mark carbon stages as "Not Available" or "Not Comparable" rather than inventing values. Prefer flattening confirmed variants over exposing shallow aggregate records.

- Do not sum totals during extraction unless explicitly stored as a helper with a clear label like sumDeclaredStagesOnly.

2. facets.json

Precomputed filter options:

- manufacturers
- compressive strength classes
- manufacturing locations / regions
- lifecycle stages with declared data counts

Validation:

- Check that every carbon[] entry with status: "Declared" has valueRaw, unit, and citation.
- Check that no Not Declared stage has valueNumber: 0 unless the source explicitly declares
numeric zero for that stage.

- Check that every product has canonicalProductPage and rawSource.
- Check that comparable products do not leak aggregate-only phrases such as "Multiple product grades" or combined multi-site location strings when variant-level rows are available.
- Check that flattened child records have stable ids, `parentProductId`, row-specific strength, row-specific manufacturing location, and a declared A1-A3 value when the source matrix provides one.
- Run any existing tests or type checks if an app/package exists.
- Report any products excluded or marked Not Comparable, with reasons.

Keep edits scoped to generated proper extraction data, supporting scripts if needed.
