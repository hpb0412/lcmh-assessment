# LLM Wiki Ingestion Rules & Agent Behavior

You are an expert Sustainability Data Engineer tasked with compiling raw, unstructured Environmental Product Declaration (EPD) layout JSONs into an interlinked, machine-and-human-readable Markdown Wiki. 

This Wiki serves as the foundational data Layer 2 for future procurement micro-services.

---

## 1. Core Operating Principles

- **Provenance First**: A data point without a traceable source tag is dangerous. Never omit citation IDs.
- **Explicit Omissions**: If an EPD omits a life cycle stage, label it explicitly as `Not Declared`. Never substitute missing data with `0`.
- **Unit Sanitization**: Normalize data into baseline units (e.g., Global Warming Potential into `kg CO2 eq`, Compressive Strength into `MPa`).

---

## 2. Ingestion Rules & Data Processing Pipeline

When scanning files inside the `raw/` directory, process the LiteParse spatial text JSON structure using these exact requirements:

### Rule A: The Invisible Citation Pattern
For every single metric, value, or location entry you write into the `wiki/` Markdown files, append an invisible HTML comment detailing the exact bounding token source.
*   **Format**: `[Value]<!--cite:filename_p[page]_t[item_index]-->`
*   **Example**: `42.5 MPa<!--cite:holcim_eco_p3_t89-->`

### Rule B: Life Cycle Stages (EN 15804) Tracking
You must map raw text inputs into their distinct lifecycle modules. Do not condense these into a single headline carbon number:
*   **Product Stage**: A1 (Raw materials), A2 (Transport), A3 (Manufacturing)
*   **Construction Stage**: A4 (Transport), A5 (Installation)
*   **Use Stage**: B1 to B7
*   **End of Life Stage**: C1 to C4
*   **Benefits & Loads**: D

---

## 3. Targeted Target-JSON Structure (The Future Output Schema)

To ensure Layer 2 (`wiki/`) contains all structural components needed to effortlessly extract the finalized JSON later, structure your wiki files so that they explicitly satisfy this schema:

```json
{
  "\$schema": "http://json-schema.org",
  "title": "EPD_Procurement_Data",
  "type": "object",
  "required": ["product_metadata", "technical_specifications", "environmental_impacts"],
  "properties": {
    "product_metadata": {
      "type": "object",
      "required": ["brand_name", "product_name", "manufacturing_location", "epd_source_file"],
      "properties": {
        "brand_name": { "type": "string" },
        "product_name": { "type": "string" },
        "manufacturing_location": { "type": "string" },
        "epd_source_file": { "type": "string" }
      }
    },
    "technical_specifications": {
      "type": "object",
      "required": ["compressive_strength_mpa"],
      "properties": {
        "compressive_strength_mpa": { "type": "number" },
        "mix_design_notes": { "type": "string" }
      }
    },
    "environmental_impacts": {
      "type": "object",
      "required": ["declared_unit", "lifecycle_stages"],
      "properties": {
        "declared_unit": { "type": "string", "example": "1 m3 of 40MPa concrete" },
        "lifecycle_stages": {
          "type": "object",
          "properties": {
            "A1_A3": { 
              "type": "object", 
              "required": ["value_kg_co2_eq", "is_declared", "citation_key"],
              "properties": {
                "value_kg_co2_eq": { "type": ["number", "null"] },
                "is_declared": { "type": "boolean" },
                "citation_key": { "type": "string" }
              }
            },
            "A4": { "type": "object" },
            "A5": { "type": "object" },
            "B1_B7": { "type": "object" },
            "C1_C4": { "type": "object" },
            "D": { "type": "object" }
          }
        }
      }
    }
  }
}
```

---

## 4. Execution Step-by-Step for Codex

1.  **Analyze**: Open a `raw/*.json` document. Find the spatial data chunks referencing product names, locations, MPa, and GWP tables.
2.  **Generate Wiki Node**: Write a clean, readable Markdown profile for that concrete product inside the `wiki/` directory.
3.  **Embed Spatial Data**: Ensure every metric listed in the Wiki features your custom `<!--cite:...-->` comment tracking its bounding box coordinates.
