# LCMH Concrete Carbon Comparison Tool

This project parses Environmental Product Declarations (EPDs) for concrete products, ingests them into a high-density Markdown knowledge wiki, extracts structured JSON data with strict provenance tracking, and displays it in a Next.js comparison interface.

## Project Flow
```
PDFs ──(LiteParse)──> Markdown ──(Ingest)──> LLM Wiki ──(Extract Script)──> JSONs ──> Next.js App
```

---

## Requirements

### Frontend (Next.js Application)
* **Node.js**: `v18+` or `v20+` (Recommended)
* **Package Manager**: `npm` (v10+)

### Backend / OCR / Scripts
* **Python**: `>=3.14` (as defined in [pyproject.toml](file:///Users/khoado/zgentic/lcmh-assessment/pyproject.toml)) or compatible `3.10+` environment
* **Package/Environment Manager**: `uv` (Recommended) for dependency lockfile sync
* **System OCR Library (Optional for Surya)**: `llama.cpp` (`brew install llama.cpp`) for local CPU inference

---

## How to Run the App

### 1. Run the Next.js Frontend
From the root directory:
```bash
# Install dependencies
npm install

# Start the local development server
npm run dev
```
The application will be accessible at [http://localhost:3000](http://localhost:3000).

### 2. Run the OCR Servers (Optional)
If you need to re-parse original PDF assets using OCR:

* **EasyOCR Server** (Runs on port `8828`):
  ```bash
  uv run python easyocr-server.py
  ```
* **Surya OCR Server** (Runs on port `8830`):
  ```bash
  uv run python suryaocr-server.py
  ```

---

## Data Extraction

Make sure your cwd is `llm-wiki` dir of this project

### Prepare raw data

Assume the PDF files provided for this assessment is "resources".

Follow these steps to convert "resources" to "raw" data

- Install llamaindex/liteparse 
```bash
npm i @llamaindex/liteparse
```
- Parse PDF to MD
```bash
lit parse document.pdf --format markdown -o output.md
```
- Put it to `llm-wiki/raw`

### Ingest Data Prompt

Below is the placeholder for the prompt used to ingest raw Markdown files into the LLM Wiki:

```markdown
Ingest `raw/[your_raw_markdown_file].md` per AGENTS.md
```

We can use the external OCR mentioned above with `liteparse`

If we want more accuracy OCR result, consider trying others (paid) like:
- LlamaIndex/LlamaParse
  - This one help improved quality of `llm-wiki/raw/epd-ies-0021165-sn252f100-llamaparse.md` 
  - Detail can be found in `EXTRACTION.md`
- Chunkr.ai
  - Didn't try this yet
  - Similar to LlamaIndex, has paid/enterprise version and free opensource version

### Extract Data Prompt

Use the prompt from `promt-templates/extract.md`

I preseved a custom scripts that the LLM generated to extract data.
We can run this script instead of sending prompt.

```python
uv run scripts/extract_product_carbon_json.py
```

So the script might not be general purpose but it currently works well with current status of the wiki
