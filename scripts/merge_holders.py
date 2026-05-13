#!/usr/bin/env python3
"""Merge Yahoo holders data into people JSON files.

Usage: python merge_holders.py <TICKER> <holders_json_file>
The holders_json_file should contain the raw `data` array from browser_evaluate.
"""
import json
import sys
import re
import os
from pathlib import Path


def parse_shares(s):
    """Parse share strings like '1.94B', '725.49M', '12,345' -> int."""
    if s is None or s == "" or s == "N/A":
        return None
    s = s.strip().replace(",", "")
    m = re.match(r"^([\d.]+)\s*([BMK]?)$", s)
    if not m:
        try:
            return int(float(s))
        except (ValueError, TypeError):
            return None
    num = float(m.group(1))
    suffix = m.group(2)
    if suffix == "B":
        num *= 1_000_000_000
    elif suffix == "M":
        num *= 1_000_000
    elif suffix == "K":
        num *= 1_000
    return int(num)


def parse_value(s):
    """Parse value strings like '436,483,189,034' -> int."""
    if s is None or s == "":
        return None
    s = s.strip().replace(",", "")
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return None


def parse_pct(s):
    """Parse '8.00%' -> 8.00 (float)."""
    if s is None or s == "":
        return None
    s = s.strip().replace("%", "")
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def parse_holder_table(rows):
    """Parse top holders / mutual funds table.
    First row is header: ['Holder', 'Shares', 'Date Reported', '% Out', 'Value']
    """
    if not rows or len(rows) < 2:
        return []
    header = rows[0]
    # Expect ['Holder', 'Shares', 'Date Reported', '% Out', 'Value']
    if len(header) < 5:
        return []
    out = []
    for r in rows[1:]:
        if len(r) < 5:
            continue
        out.append({
            "name": r[0],
            "shares": parse_shares(r[1]),
            "date_reported": r[2],
            "pct_outstanding": parse_pct(r[3]),
            "value_usd": parse_value(r[4]),
        })
    return out


def parse_breakdown(rows):
    """Parse ownership breakdown table.
    Rows look like ['Breakdown'] header, then [value, label] pairs.
    """
    out = {}
    for r in rows:
        if len(r) >= 2:
            value = r[0]
            label = r[1]
            out[label] = value
    return out


def merge(ticker, tables_data, output_dir):
    """Merge tables data into existing JSON file."""
    fp = Path(output_dir) / f"{ticker}.json"
    if not fp.exists():
        print(f"FAIL: {ticker} - JSON file not found at {fp}")
        return False

    with open(fp, "r", encoding="utf-8") as f:
        existing = json.load(f)

    if not tables_data or len(tables_data) == 0:
        print(f"SKIP: {ticker} - no tables data")
        return False

    # Find breakdown, top holders, mutual funds tables
    breakdown = None
    top_holders = None
    top_mutual_funds = None

    for tbl in tables_data:
        if not tbl:
            continue
        first_row = tbl[0]
        # Breakdown table: first row is ['Breakdown']
        if len(first_row) == 1 and "breakdown" in first_row[0].lower():
            breakdown = parse_breakdown(tbl[1:])
        # Holder table: first row is ['Holder', 'Shares', ...]
        elif first_row[0].lower() == "holder":
            parsed = parse_holder_table(tbl)
            if top_holders is None:
                top_holders = parsed
            else:
                top_mutual_funds = parsed

    updates = {}
    if breakdown:
        updates["ownership_breakdown"] = breakdown
    if top_holders:
        updates["top_holders"] = top_holders
    if top_mutual_funds:
        updates["top_mutual_funds"] = top_mutual_funds

    if not updates:
        print(f"SKIP: {ticker} - parsed nothing useful")
        return False

    # Merge
    existing.update(updates)

    # Update sources
    sources = existing.get("sources", {})
    sources["top_holders"] = f"https://finance.yahoo.com/quote/{ticker}/holders/"
    existing["sources"] = sources

    # Update as_of
    existing["as_of"] = "2026-05-13"

    with open(fp, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

    n_holders = len(top_holders) if top_holders else 0
    n_funds = len(top_mutual_funds) if top_mutual_funds else 0
    n_break = len(breakdown) if breakdown else 0
    print(f"OK: {ticker} - {n_holders} holders, {n_funds} funds, {n_break} breakdown fields")
    return True


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: merge_holders.py <TICKER> <json_file>")
        sys.exit(1)

    ticker = sys.argv[1]
    json_path = sys.argv[2]
    output_dir = sys.argv[3] if len(sys.argv) > 3 else r"C:\data\dev\testprojects\ai-supply-chain\data\people"

    with open(json_path, "r", encoding="utf-8") as f:
        tables_data = json.load(f)

    merge(ticker, tables_data, output_dir)
