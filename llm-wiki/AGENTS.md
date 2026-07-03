# LLM Wiki Ingestion Rules & Agent Behavior

You are an expert Document Analysis Engineer tasked with compiling raw LiteParse Markdown documents, parsed from original PDF documents, into an interlinked, high-density Markdown Knowledge Wiki.

This Wiki serves as an immutable, long-term knowledge base. It must capture ALL data points, metadata, and structural notes present in the source files so that down-stream application scripts can extract various data schemas later without rebuilding the wiki.

The architecture is layered:

1. `raw/*.md` files are the immutable LiteParse Markdown representation of the original PDF source. Never modify them.
2. `wiki/products/*.md` files are exhaustive canonical product evidence pages. They may be dense because they preserve source-backed facts for future extraction.
3. `wiki/products/index.md`, folder indexes, and relationship pages are compact retrieval surfaces. They route agents to the right concept or evidence page without requiring a full product-page scan for common queries.

---

## 1. Folder Structure

```
raw/          -- Source LiteParse Markdown documents (immutable -- never modify)
wiki/         -- Markdown pages maintained by the AI agent
wiki/index.md -- Knowledge base home page and top-level navigation hub
wiki/log.md   -- Append-only audit ledger of all file updates
wiki/products/index.md        -- Compact product registry for routing, not a full data dump
wiki/products/                -- Exhaustive canonical product evidence pages named manufacturer_mix_identifier.md
wiki/manufacturers/index.md   -- Manufacturer relationship page index
wiki/manufacturers/           -- Derived manufacturer relationship pages
wiki/facilities/index.md      -- Production facility and region page index
wiki/facilities/              -- Derived production facility and region pages
wiki/standards/index.md       -- Standards and PCR page index
wiki/standards/               -- Derived standards and PCR relationship pages
wiki/lifecycle-modules/index.md -- Lifecycle module page index
wiki/lifecycle-modules/       -- Derived lifecycle module comparison pages
 wiki/sources/index.md         -- Raw source document register mapping raw Markdown to canonical wiki pages
```

The listed relationship folders are required baseline indexes, not a closed taxonomy. If a source document introduces a recurring concept that does not fit these folders, create a new derived page or folder with a clear name, link it from `wiki/index.md`, update relevant folder indexes, and log the structural addition in `wiki/log.md`.

---

## 2. Core Operating Principles

1. **Exhaustive Knowledge Capture**: Extract all data fields, including metadata, strengths, mix designs, declared units, standards, PCRs, facilities, and EN 15804 lifecycle modules. Do not truncate.
2. **Visible Citations**: Every single extracted fact, metric, date, product name, registration number, location, lifecycle value, or declaration status must terminate with a visible trace tag pointing back to the immutable raw Markdown source.
   * Preferred format when raw Markdown preserves PDF page markers: `[Value] [cite:filename_p[page]_l[line]]`
   * Fallback format when page markers are absent: `[Value] [cite:filename_l[line]]`
   * Use a line range only when the fact requires adjacent table/header context: `[Value] [cite:filename_l[start]-l[end]]`
   * Example with page marker: `42.5 MPa [cite:holcim_boston_p3_l89]`
   * Example without page marker: `42.5 MPa [cite:holcim_boston_l89]`
3. **Line-Number Provenance**: Before extracting facts, inspect raw Markdown with stable line numbers, for example `nl -ba raw/source.md`. Citations must point to the exact raw line where the cited value appears. If the value only makes sense with nearby heading or table context, cite the value line and include the minimum necessary line range.
4. **Anti-Zero Omissions**: If a lifecycle stage is omitted or marked MND/NR, expose the normalized status as `Not Declared`. Never assume `0`. When the raw document uses `MND`, `NR`, or similar wording, preserve the raw wording in the exhaustive evidence table if useful, but relationship/retrieval pages must use `Not Declared`.
5. **No Math/Conversions**: Preserve raw strings and units exactly as written in the LiteParse Markdown text (for example, keep `psi` if written as `psi`). Do not calculate, convert, round, or normalize numeric values unless the source already provides the normalized value.
6. **Index-First Retrieval**: For information retrieval, read `wiki/index.md` first; then use folder indexes, `wiki/products/index.md`, or `wiki/sources/index.md` to route. Read derived relationship pages for cross-cutting facts. Read canonical product evidence pages only when detailed source-backed facts are needed. Read raw Markdown only for ingestion, citation repair, contradiction checks, or missing source validation.
7. **Lossless Product Evidence, Compact Retrieval**: Do not slim canonical product evidence pages by deleting cited facts. Optimize the wiki by adding compact snapshots, indexes, relationship pages, and extraction-profile pages rather than by removing evidence.
8. **Comparable Variant Extraction**: If one EPD declares multiple product variants, strengths, facilities, batching plants, or product/plant-specific carbon values, do not leave the wiki with only an aggregate "multiple values" retrieval surface. Keep one exhaustive aggregate canonical product page, but add a cited compact matrix page that exposes every confidently aligned comparable variant row needed by downstream app extraction.
   * A comparable variant row must identify the product or mix code, variant, strength, facility or batching plant, declared carbon metric, unit/status, source product page, and raw citation.
   * For app-facing extraction, one comparable row should represent one product variant at one manufacturing location with one declared carbon value.
   * Preserve ambiguous LiteParse fragments in the canonical page or matrix as `Needs manual confirmation`; do not treat them as comparable app rows until manually confirmed.
   * Avoid relying on shallow aggregate phrases such as `Multiple product grades` or combined multi-site locations as the only representation when source tables provide variant-level evidence.

---

## 3. Raw Markdown Provenance Rules

1. `raw/*.md` files are immutable once added. Do not edit them to add page breaks, line numbers, normalized headings, or cleanup text.
2. If LiteParse emits page boundary markers, preserve their meaning in citations by using the `_p[page]_l[line]` citation format.
3. If LiteParse does not emit page boundary markers, use `_l[line]` citations. This is acceptable because raw source files are immutable and line numbers remain stable.
4. For Markdown tables, cite the line containing the exact cell value. If the table header is required to identify the metric, cite the smallest line range that includes the header and the value row.
5. For figures, captions, footnotes, or notes extracted as Markdown text, cite the line containing the caption/note text. If LiteParse omits the actual visual figure and only preserves nearby text, do not invent figure content; record only the available caption/note text with citation.
6. Do not use generated wiki files as primary source citations. Derived pages may summarize canonical product pages, but every source-derived value must still carry the raw Markdown citation.

---

## 4. Ingest & Sync Workflow

When a user adds a new raw source file and asks you to ingest it:

1. Create the unique exhaustive canonical product evidence page under `wiki/products/[manufacturer]_[mix_identifier].md` following the layout rules below.
2. Add a compact `## Product Snapshot` table near the top of the product page with route-critical cited fields: Product Name, Manufacturer, EPD Registration Number, Compressive Strength, Declared Unit, Facility / Region, A1-A3 GWP, and Lifecycle Scope.
3. **Update `wiki/products/index.md`**: Append a compact registry row tracking Product Name, Manufacturer, Compressive Strength, Declared Unit, A1-A3 GWP, Canonical Evidence Page, and Raw Source.
4. **Update Derived Relationship Pages**: Add cited rows to all relevant manufacturer, facility, standard, lifecycle module, strength class, and comparison pages. Derived pages must reorganize facts from canonical product pages or raw LiteParse Markdown citations only; they must not introduce uncited facts or conversions.
   * Relationship rows should use concept-oriented columns: `Entity`, `Concept`, `Value`, `Unit / Status`, `Source Product`, and `Cite`.
   * Use `Unit / Status` for units such as `kg CO2 eq.`, `MPa`, `kg`, or normalized statuses such as `Declared` and `Not Declared`.
   * Preserve exact source wording in `Value`; do not calculate or normalize numbers.
5. **Update Folder Indexes**: Keep the relevant folder-level `index.md` pages in sync so each new product, relationship page, comparison, and source document is reachable from `wiki/index.md` within two clicks.
6. **Update `wiki/sources/index.md`**: Add or update the raw source document register row mapping the raw Markdown file to the canonical product page, document type, EPD registration number, manufacturer, page-marker availability, and ingestion status. If a raw Markdown file exists but has not been ingested, list it as `Pending ingestion`.
7. **Update `wiki/log.md`**: Append a clean, timestamped entry logging the data insertion, for example `- 2026-07-01: Ingested raw/holcim_mix_40.md. Added mix metadata and A1-A3 carbon metrics.`

---

## 5. Lint & Audit Rules

When the user asks you to lint, verify, or audit the wiki, scan all files and report a numbered list of issues matching these criteria:

- **Contradiction Check**: Flag instances where the same product or EPD registration number shows conflicting values across different files.
- **Unit Mismatch Check**: Flag any page using non-standardized phrasing formats that might break downstream JSON regex parsers.
- **Missing Citation Check**: Identify any quantitative number, source-derived fact, metric, date, product identifier, or location that lacks a trailing `[cite:...]` tag.
- **Citation Format Check**: Flag obsolete spatial JSON token citations such as `_t[item_index]`; new citations must use Markdown page/line or line-only anchors.
- **Citation Target Check**: Verify cited line numbers exist in the referenced raw Markdown file where practical.
- **Format Compliance**: Flag any page that deviates from the standard structural header layouts.
- **Relationship Sync Check**: Flag products that appear in `wiki/products/index.md` but are missing from relevant derived relationship pages or folder indexes.

---

## 6. File Layout Schema

There are three supported wiki page types:

1. **Canonical Product Evidence Pages**: One comprehensive source-backed page per raw EPD/product. These pages are the source of truth and must use the product layout below. They should be exhaustive, not minimal.
2. **Derived Relationship Pages**: Cross-cutting pages under `wiki/manufacturers/`, `wiki/facilities/`, `wiki/standards/`, `wiki/lifecycle-modules/`, `wiki/strength-classes/`, and `wiki/comparisons/`. These pages summarize and link facts from canonical product pages. Every extracted fact or metric on derived pages must include visible raw Markdown citations, and every row must link back to the source product page.
3. **Navigation Index Pages**: `wiki/index.md` and folder-level `index.md` files provide discovery paths only. Do not duplicate all extracted facts there. Use citations only where the index itself includes source-derived factual values.

Every generated product wiki file must strictly use this layout:

```markdown
---
document_id: "Unique text identifier or filename hash"
processing_engine: "LiteParse"
source_format: "Markdown"
---

# [Manufacturer Brand Name] - [Exact Product / Variant Name]

## Product Snapshot
| Field | Value | Cite |
| --- | --- | --- |
| Product Name | [Exact product name] | [cite:id] |
| Manufacturer | [Exact manufacturer] | [cite:id] |
| EPD Registration Number | [Exact registration number] | [cite:id] |
| Compressive Strength | [Exact value and unit] | [cite:id] |
| Declared Unit | [Exact value and unit] | [cite:id] |
| Facility / Region | [Exact facility, site, or region] | [cite:id] |
| A1-A3 GWP | [Exact value and unit] | [cite:id] |
| Lifecycle Scope | [Exact scope wording] | [cite:id] |

## Field Inventory
| Field Group | Representative Fields | Section |
| --- | --- | --- |
| Administrative metadata | registration, verification, publication, validity, owner, facility | 1. Document & Administrative Metadata |
| Technical specifications | product identity, strength, mix design, SCM, water-to-cement ratio, composition | 2. Material Traits & Technical Specifications |
| EPD metrics | declared unit, lifecycle scope, A1-A3, A4-A5, C1-C4, D | 3. Environmental Product Declaration Metrics |

## 1. Document & Administrative Metadata
| Key | Value | Cite |
| --- | --- | --- |
| Registration Number | [Exact registration number] | [cite:id] |
| Verification Body | [Exact verification body] | [cite:id] |
| Issue Date | [Exact issue date] | [cite:id] |
| Manufacturing Facility | [Exact facility name and location] | [cite:id] |

## 2. Material Traits & Technical Specifications
| Key | Value | Cite |
| --- | --- | --- |
| Compressive Strength | [Exact value and unit] | [cite:id] |
| Curing Time | [Exact value and unit] | [cite:id] |
| Mix Design | [Exact mix design text] | [cite:id] |
| SCM Percentage | [Exact value and unit] | [cite:id] |
| Water-to-Cement Ratio | [Exact value] | [cite:id] |

## 3. Environmental Product Declaration Metrics
| Key | Value | Cite |
| --- | --- | --- |
| Declared Unit | [Value + Unit] | [cite:id] |

### Core Product Stages (A1-A3)
| Key | Value | Cite |
| --- | --- | --- |
| Status | [Declared / Not Declared] | [cite:id] |
| Global Warming Potential | [Value + Unit] | [cite:id] |

### Construction & Distribution Stages (A4-A5)
| Key | Value | Cite |
| --- | --- | --- |
| A4 (Transport to Site) | [Value + Unit or "Not Declared"] | [cite:id] |
| A5 (Installation/Assembly) | [Value + Unit or "Not Declared"] | [cite:id] |

### End of Life & External Benefits (C1-C4, D)
| Key | Value | Cite |
| --- | --- | --- |
| C1-C4 (Deconstruction/Disposal modules) | [Value + Unit or "Not Declared"] | [cite:id] |
| D (Recycling/Reuse/Recovery potential) | [Value + Unit or "Not Declared"] | [cite:id] |
```

Every derived relationship page must use compact cited tables. The required minimum columns are:

```markdown
# [Relationship Page Title]

| Entity | Concept | Value | Unit / Status | Source Product | Cite |
| --- | --- | --- | --- | --- | --- |
| [Product, manufacturer, facility, standard, lifecycle module, or strength class] | [Concept label] | [Exact cited value] | [Unit, Declared, Not Declared, or N/A] | [Product page link] | [cite:id] |
```
