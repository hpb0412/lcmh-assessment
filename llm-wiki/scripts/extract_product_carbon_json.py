#!/usr/bin/env python3
"""Extract app-ready concrete product carbon JSON from the wiki.

Inputs are read from wiki/*.md files. Outputs are written to ../data so the
immutable raw files and maintained wiki pages are not modified.
"""

from __future__ import annotations

import json
import re
from pathlib import Path


STAGES = [
    "A1-A3",
    "A4",
    "A5",
    "B1",
    "B2",
    "B3",
    "B4",
    "B5",
    "B6",
    "B7",
    "C1",
    "C2",
    "C3",
    "C4",
    "D",
]

NOT_COMPARABLE_PRODUCTS = {
    "hallett_group_ready_mix_concrete_products": "multiple product- and plant-specific values",
}


def split_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def citation_cell(cell: str) -> str:
    return " ".join(re.findall(r"\[cite:[^\]]+\]", cell))


def clean_value(cell: str) -> str:
    return re.sub(r"\s*\[cite:[^\]]+\]", "", cell).strip()


def parse_tables(text: str) -> list[tuple[list[str], list[list[str]]]]:
    lines = text.splitlines()
    tables: list[tuple[list[str], list[list[str]]]] = []
    i = 0

    while i < len(lines):
        if (
            lines[i].startswith("|")
            and i + 1 < len(lines)
            and lines[i + 1].startswith("|")
            and "---" in lines[i + 1]
        ):
            header = split_row(lines[i])
            rows: list[list[str]] = []
            i += 2
            while i < len(lines) and lines[i].startswith("|"):
                rows.append(split_row(lines[i]))
                i += 1
            tables.append((header, rows))
        else:
            i += 1

    return tables


def product_snapshot(text: str) -> dict[str, dict[str, str]]:
    for header, rows in parse_tables(text):
        if header[:3] == ["Field", "Value", "Cite"]:
            return {
                row[0]: {
                    "value": clean_value(row[1]),
                    "citation": citation_cell(row[2]) or citation_cell(row[1]),
                }
                for row in rows
                if len(row) >= 3
            }
    return {}


def module_matrix(text: str) -> dict[str, dict[str, str]]:
    statuses: dict[str, dict[str, str]] = {}

    for header, rows in parse_tables(text):
        if not (header and header[0] == "Module" and "Cite" in header):
            continue

        if "Status" in header:
            status_index = header.index("Status")
        elif "Normalized Status" in header:
            status_index = header.index("Normalized Status")
        else:
            continue

        cite_index = header.index("Cite")
        for row in rows:
            if len(row) <= max(status_index, cite_index):
                continue

            modules = [row[0]]
            if row[0] == "B1-B7":
                modules = [f"B{i}" for i in range(1, 8)]

            for module in modules:
                statuses[module] = {
                    "status": clean_value(row[status_index]),
                    "citation": citation_cell(row[cite_index]),
                }

    return statuses


def find_primary_gwp_row(text: str) -> tuple[list[str], list[str], str] | None:
    fallback: tuple[list[str], list[str], str] | None = None

    for header, rows in parse_tables(text):
        if "Unit" not in header or "Cite" not in header or "A1-A3" not in header:
            continue
        if not ({"C1", "C2", "C3", "C4", "D"} & set(header)):
            continue

        for row in rows:
            if not row:
                continue
            label = clean_value(row[0]).lower()
            if label.startswith("gwp-total") or label.startswith("gwp - total"):
                return header, row, "GWP-Total"
            if fallback is None and label in {"gwp-fossil", "gwp - fossil"}:
                fallback = (header, row, "GWP-Fossil")

    return fallback


def split_value_unit(raw: str) -> tuple[str, str] | None:
    value = clean_value(raw).replace("<sup>", "").replace("</sup>", "")
    match = re.match(r"^\s*([-+]?\d+(?:\.\d+)?(?:E[-+]?\d+)?)\s+(.+?)\s*$", value, re.IGNORECASE)
    if not match:
        return None
    return match.group(1), match.group(2)


def key_value_rows(text: str) -> dict[str, dict[str, str]]:
    values: dict[str, dict[str, str]] = {}

    for header, rows in parse_tables(text):
        if header[:3] != ["Key", "Value", "Cite"]:
            continue
        for row in rows:
            if len(row) < 3:
                continue
            values[clean_value(row[0]).lower()] = {
                "value": clean_value(row[1]),
                "citation": citation_cell(row[2]) or citation_cell(row[1]),
            }

    return values


def build_carbon_from_key_values(
    text: str,
    snapshot: dict[str, dict[str, str]],
    matrix: dict[str, dict[str, str]],
) -> tuple[list[dict[str, object]] | None, list[str]]:
    rows = key_value_rows(text)
    extracted: dict[str, tuple[str, str, str]] = {}

    snapshot_gwp = snapshot.get("A1-A3 GWP")
    if snapshot_gwp:
        parsed = split_value_unit(snapshot_gwp.get("value", ""))
        if parsed:
            extracted["A1-A3"] = (
                parsed[0],
                parsed[1],
                snapshot_gwp.get("citation", ""),
            )

    a4_gwp = rows.get("a4 global warming potential - total")
    if a4_gwp:
        parsed = split_value_unit(a4_gwp.get("value", ""))
        if parsed:
            extracted["A4"] = (
                parsed[0],
                parsed[1],
                a4_gwp.get("citation", ""),
            )

    if not extracted:
        return None, []

    carbon: list[dict[str, object]] = []
    for stage in STAGES:
        if stage in extracted:
            value, unit, citation = extracted[stage]
            add_stage(carbon, stage, "Declared", citation, "GWP-Total", value, unit)
            continue

        module_status = matrix.get(stage, {})
        status = "Not Available" if module_status.get("status") == "Declared" else "Not Declared"
        add_stage(carbon, stage, status, module_status.get("citation", ""), "GWP-Total")

    return carbon, ["partial carbon values extracted from product snapshot/key-value rows"]


def parse_number(raw: str) -> float | None:
    value = raw.strip().replace(",", "")
    if value in {"", "-", "ND", "NR", "MND", "Not Declared", "Not Available"}:
        return None
    if re.fullmatch(r"[-+]?\d+(?:\.\d+)?(?:E[-+]?\d+)?", value, re.IGNORECASE):
        return float(value)
    return None


def compressive_strength_mpa(raw: str) -> float | None:
    match = re.search(r"(\d+(?:\.\d+)?)\s*MPa", raw, re.IGNORECASE)
    if match:
        return float(match.group(1))

    match = re.search(r"\bS(\d+)\b", raw, re.IGNORECASE)
    if match:
        return float(match.group(1))

    return None


def add_stage(
    carbon: list[dict[str, object]],
    stage: str,
    status: str,
    citation: str,
    indicator: str = "GWP-Total",
    value: str | None = None,
    unit: str | None = None,
) -> None:
    entry: dict[str, object] = {
        "stage": stage,
        "status": status,
        "indicator": indicator,
        "citation": citation,
    }

    if value is not None:
        entry["valueRaw"] = value
        number = parse_number(value)
        if number is not None:
            entry["valueNumber"] = number

    if unit is not None and value is not None:
        entry["unit"] = unit

    carbon.append(entry)


def build_carbon(
    text: str,
    page_id: str,
    snapshot: dict[str, dict[str, str]],
) -> tuple[list[dict[str, object]], list[str]]:
    matrix = module_matrix(text)
    carbon: list[dict[str, object]] = []

    if page_id in NOT_COMPARABLE_PRODUCTS:
        for stage in STAGES:
            module_status = matrix.get(stage, {})
            status = "Not Declared" if module_status.get("status") == "Not Declared" else "Not Comparable"
            add_stage(
                carbon,
                stage,
                status,
                module_status.get("citation") or snapshot.get("A1-A3 GWP", {}).get("citation", ""),
            )
        return carbon, [NOT_COMPARABLE_PRODUCTS[page_id]]

    primary = find_primary_gwp_row(text)
    if primary is None:
        fallback_carbon, fallback_flags = build_carbon_from_key_values(text, snapshot, matrix)
        if fallback_carbon is not None:
            return fallback_carbon, fallback_flags

        for stage in STAGES:
            module_status = matrix.get(stage, {})
            status = "Not Available" if module_status.get("status") == "Declared" else "Not Declared"
            add_stage(carbon, stage, status, module_status.get("citation", ""))
        return carbon, ["no primary environmental indicator row found"]

    header, row, indicator = primary
    unit = row[header.index("Unit")]
    row_citation = citation_cell(row[header.index("Cite")])
    values = {column: row[index] for index, column in enumerate(header) if index < len(row)}

    for stage in STAGES:
        if stage in values:
            raw = clean_value(values[stage])
            if raw in {"ND", "MND", "NR", "-", ""}:
                add_stage(
                    carbon,
                    stage,
                    "Not Declared",
                    matrix.get(stage, {}).get("citation") or row_citation,
                    indicator,
                )
            else:
                add_stage(carbon, stage, "Declared", row_citation, indicator, raw, unit)
        elif stage.startswith("B") and "B1-B7" in values:
            raw = clean_value(values["B1-B7"])
            status = "Not Declared" if raw in {"ND", "MND", "NR", "-", ""} else "Not Comparable"
            add_stage(
                carbon,
                stage,
                status,
                matrix.get(stage, {}).get("citation") or row_citation,
                indicator,
            )
        else:
            module_status = matrix.get(stage, {})
            status = "Not Available" if module_status.get("status") == "Declared" else "Not Declared"
            add_stage(carbon, stage, status, module_status.get("citation") or row_citation, indicator)

    return carbon, []


def raw_source_map(root: Path) -> dict[str, str]:
    sources_index = root / "wiki/sources/index.md"
    source_by_page: dict[str, str] = {}

    for line in sources_index.read_text().splitlines():
        if "| [raw/" not in line or "../products/" not in line:
            continue

        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        status = cells[6] if len(cells) > 6 else ""
        if status.lower().startswith("superseded"):
            continue

        raw_match = re.search(r"\[raw/([^\]]+)\]", cells[0]) if cells else None
        page_match = re.search(r"\]\(\.\./products/([^\)]+)\)", cells[1]) if len(cells) > 1 else None
        if raw_match and page_match:
            source_by_page[Path(page_match.group(1)).stem] = "raw/" + raw_match.group(1)

    return source_by_page


def build_products(root: Path) -> list[dict[str, object]]:
    source_by_page = raw_source_map(root)
    product_files = sorted(
        path for path in (root / "wiki/products").glob("*.md") if path.name != "index.md"
    )
    products: list[dict[str, object]] = []

    for path in product_files:
        text = path.read_text()
        page_id = path.stem
        snapshot = product_snapshot(text)
        carbon, flags = build_carbon(text, page_id, snapshot)

        strength = snapshot.get("Compressive Strength", {"value": "", "citation": ""})
        location = snapshot.get("Facility / Region", {"value": "", "citation": ""})
        record: dict[str, object] = {
            "id": page_id,
            "productName": snapshot.get("Product Name", {"value": "", "citation": ""}),
            "manufacturer": snapshot.get("Manufacturer", {"value": "", "citation": ""}),
            "epdRegistrationNumber": snapshot.get(
                "EPD Registration Number", {"value": "", "citation": ""}
            ),
            "canonicalProductPage": f"wiki/products/{path.name}",
            "rawSource": source_by_page.get(page_id, ""),
            "declaredUnit": snapshot.get("Declared Unit", {"value": "", "citation": ""}),
            "compressiveStrength": {
                "raw": strength.get("value", ""),
                "citation": strength.get("citation", ""),
            },
            "manufacturingLocation": {
                "raw": location.get("value", ""),
                "searchableText": location.get("value", "").lower(),
                "citation": location.get("citation", ""),
            },
            "lifecycleScope": snapshot.get("Lifecycle Scope", {"value": "", "citation": ""}),
            "carbon": carbon,
            "comparabilityFlags": flags,
        }

        value_mpa = compressive_strength_mpa(strength.get("value", ""))
        if value_mpa is not None:
            record["compressiveStrength"]["valueMpa"] = value_mpa  # type: ignore[index]

        products.append(record)

    return sorted(products, key=lambda product: str(product["id"]))


def build_facets(products: list[dict[str, object]]) -> dict[str, object]:
    manufacturers = sorted(
        {
            product["manufacturer"]["value"]  # type: ignore[index]
            for product in products
            if product["manufacturer"]["value"]  # type: ignore[index]
        }
    )

    strengths: list[dict[str, object]] = []
    seen_strengths: set[tuple[float | None, str]] = set()
    for product in products:
        strength = product["compressiveStrength"]  # type: ignore[assignment]
        raw = strength["raw"]  # type: ignore[index]
        key = (strength.get("valueMpa"), raw)  # type: ignore[attr-defined]
        if raw and key not in seen_strengths:
            entry: dict[str, object] = {"raw": raw, "citation": strength["citation"]}  # type: ignore[index]
            if key[0] is not None:
                entry["valueMpa"] = key[0]
            strengths.append(entry)
            seen_strengths.add(key)
    strengths.sort(key=lambda item: (item.get("valueMpa", 9999), item["raw"]))

    locations: list[dict[str, str]] = []
    seen_locations: set[str] = set()
    for product in products:
        location = product["manufacturingLocation"]  # type: ignore[assignment]
        raw = location["raw"]  # type: ignore[index]
        if raw and raw not in seen_locations:
            locations.append(
                {
                    "raw": raw,
                    "searchableText": location["searchableText"],  # type: ignore[index]
                    "citation": location["citation"],  # type: ignore[index]
                }
            )
            seen_locations.add(raw)
    locations.sort(key=lambda item: item["searchableText"])

    lifecycle_stages = []
    for stage in STAGES:
        lifecycle_stages.append(
            {
                "stage": stage,
                "declaredCount": sum(
                    1
                    for product in products
                    for carbon in product["carbon"]  # type: ignore[index]
                    if carbon["stage"] == stage and carbon["status"] == "Declared"
                ),
                "notDeclaredCount": sum(
                    1
                    for product in products
                    for carbon in product["carbon"]  # type: ignore[index]
                    if carbon["stage"] == stage and carbon["status"] == "Not Declared"
                ),
                "notAvailableCount": sum(
                    1
                    for product in products
                    for carbon in product["carbon"]  # type: ignore[index]
                    if carbon["stage"] == stage and carbon["status"] == "Not Available"
                ),
                "notComparableCount": sum(
                    1
                    for product in products
                    for carbon in product["carbon"]  # type: ignore[index]
                    if carbon["stage"] == stage and carbon["status"] == "Not Comparable"
                ),
            }
        )

    return {
        "manufacturers": manufacturers,
        "compressiveStrengthClasses": strengths,
        "manufacturingLocations": locations,
        "lifecycleStages": lifecycle_stages,
    }


def validate(products: list[dict[str, object]]) -> None:
    errors: list[str] = []

    for product in products:
        product_id = product["id"]
        if not product.get("canonicalProductPage") or not product.get("rawSource"):
            errors.append(f"{product_id}: missing canonicalProductPage/rawSource")

        for carbon in product["carbon"]:  # type: ignore[index]
            if carbon["status"] == "Declared" and not all(
                carbon.get(key) for key in ("valueRaw", "unit", "citation")
            ):
                errors.append(
                    f"{product_id} {carbon['stage']}: declared carbon missing valueRaw/unit/citation"
                )
            if carbon["status"] == "Not Declared" and carbon.get("valueNumber") == 0:
                errors.append(f"{product_id} {carbon['stage']}: Not Declared has zero valueNumber")

    if errors:
        raise SystemExit("\n".join(errors))


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    data_dir = root.parent / "data"
    data_dir.mkdir(exist_ok=True)

    products = build_products(root)
    facets = build_facets(products)
    validate(products)

    (data_dir / "products.json").write_text(
        json.dumps(products, indent=2, ensure_ascii=False) + "\n"
    )
    (data_dir / "facets.json").write_text(json.dumps(facets, indent=2, ensure_ascii=False) + "\n")

    flagged = {
        product["id"]: product["comparabilityFlags"]
        for product in products
        if product["comparabilityFlags"]
    }
    print(f"wrote {data_dir / 'products.json'} ({len(products)} products)")
    print(f"wrote {data_dir / 'facets.json'}")
    print(f"flagged: {json.dumps(flagged, ensure_ascii=False)}")


if __name__ == "__main__":
    main()
