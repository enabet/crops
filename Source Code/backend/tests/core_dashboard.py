"""
Generate a simple HTML dashboard for CARDI standalone core tests.

Run from the backend directory:

    python3 -m tests.core_dashboard

Optional:

    python3 -m tests.core_dashboard --open
    python3 -m tests.core_dashboard --output tests/reports/core_test_dashboard.html

The dashboard is intentionally dependency-free: it uses unittest, JSON, and
plain HTML/CSS so it works in local Python and inside the Docker backend.
"""

from __future__ import annotations

import argparse
import html
import json
import sys
import time
import unittest
import webbrowser
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable


DEFAULT_TEST_MODULE = "tests.test_core_modules"
DEFAULT_OUTPUT = Path(__file__).resolve().parent / "reports" / "core_test_dashboard.html"


@dataclass
class TestRecord:
    test_id: str
    class_name: str
    test_name: str
    group: str
    status: str
    elapsed_ms: float
    message: str = ""


class DashboardTestResult(unittest.TextTestResult):
    """unittest result that records duration and status for each test."""

    def __init__(self, stream, descriptions, verbosity):
        super().__init__(stream, descriptions, verbosity)
        self._started_at: dict[unittest.case.TestCase, float] = {}
        self.records: list[TestRecord] = []

    def startTest(self, test):
        self._started_at[test] = time.perf_counter()
        super().startTest(test)

    def addSuccess(self, test):
        self._record(test, "passed")
        super().addSuccess(test)

    def addFailure(self, test, err):
        self._record(test, "failed", self._exc_info_to_string(err, test))
        super().addFailure(test, err)

    def addError(self, test, err):
        self._record(test, "error", self._exc_info_to_string(err, test))
        super().addError(test, err)

    def addSkip(self, test, reason):
        self._record(test, "skipped", reason)
        super().addSkip(test, reason)

    def _record(self, test, status: str, message: str = ""):
        started = self._started_at.get(test, time.perf_counter())
        elapsed_ms = (time.perf_counter() - started) * 1000
        test_id = test.id()
        class_name, test_name = parse_test_id(test_id)
        self.records.append(
            TestRecord(
                test_id=test_id,
                class_name=class_name,
                test_name=test_name,
                group=group_for_class(class_name),
                status=status,
                elapsed_ms=elapsed_ms,
                message=message,
            )
        )


class DashboardTestRunner(unittest.TextTestRunner):
    resultclass = DashboardTestResult


def parse_test_id(test_id: str) -> tuple[str, str]:
    parts = test_id.split(".")
    if len(parts) < 2:
        return "Unknown", test_id
    return parts[-2], parts[-1]


def group_for_class(class_name: str) -> str:
    if "GIS" in class_name or "Spatial" in class_name:
        return "GIS / Spatial"
    if "Gamification" in class_name:
        return "Gamification"
    if "FarmerProfile" in class_name:
        return "Farmer Profile"
    if "CropRecord" in class_name:
        return "Crop Records"
    return class_name.replace("Tests", "").replace("Core", "")


def run_tests(test_module: str, verbosity: int) -> tuple[DashboardTestResult, float]:
    suite = unittest.defaultTestLoader.loadTestsFromName(test_module)
    runner = DashboardTestRunner(verbosity=verbosity)
    started = time.perf_counter()
    result = runner.run(suite)
    elapsed_ms = (time.perf_counter() - started) * 1000
    return result, elapsed_ms


def build_metrics(records: list[TestRecord], total_elapsed_ms: float) -> dict:
    total = len(records)
    passed = count_status(records, "passed")
    failed = count_status(records, "failed")
    errors = count_status(records, "error")
    skipped = count_status(records, "skipped")
    pass_rate = (passed / total * 100) if total else 0
    average_ms = (sum(record.elapsed_ms for record in records) / total) if total else 0
    slowest = sorted(records, key=lambda item: item.elapsed_ms, reverse=True)[:8]
    groups = []

    for group in sorted({record.group for record in records}):
        group_records = [record for record in records if record.group == group]
        groups.append(
            {
                "name": group,
                "total": len(group_records),
                "passed": count_status(group_records, "passed"),
                "failed": count_status(group_records, "failed"),
                "errors": count_status(group_records, "error"),
                "skipped": count_status(group_records, "skipped"),
                "duration_ms": round(sum(record.elapsed_ms for record in group_records), 3),
                "average_ms": round(sum(record.elapsed_ms for record in group_records) / len(group_records), 3),
            }
        )

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "errors": errors,
            "skipped": skipped,
            "pass_rate": round(pass_rate, 2),
            "total_elapsed_ms": round(total_elapsed_ms, 3),
            "average_test_ms": round(average_ms, 3),
            "slowest_test_ms": round(slowest[0].elapsed_ms, 3) if slowest else 0,
        },
        "groups": groups,
        "slowest": [asdict(record) for record in slowest],
        "tests": [asdict(record) for record in records],
    }


def count_status(records: Iterable[TestRecord], status: str) -> int:
    return sum(1 for record in records if record.status == status)


def render_dashboard(metrics: dict) -> str:
    summary = metrics["summary"]
    groups = metrics["groups"]
    tests = metrics["tests"]
    slowest = metrics["slowest"]
    pass_rate = summary["pass_rate"]
    max_group_duration = max((group["duration_ms"] for group in groups), default=1) or 1
    max_group_total = max((group["total"] for group in groups), default=1) or 1

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CARDI Core Test Dashboard</title>
  <style>
    :root {{
      --bg: #f7f8f4;
      --panel: #ffffff;
      --ink: #16221a;
      --muted: #65736b;
      --line: #dfe5da;
      --green: #2f7653;
      --green-soft: #e8f4ed;
      --gold: #c98c31;
      --red: #be3b3b;
      --red-soft: #fae8e8;
      --shadow: 0 16px 38px rgba(22, 34, 26, 0.08);
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    main {{
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 32px 0 48px;
    }}
    header {{
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: flex-end;
      margin-bottom: 24px;
    }}
    h1 {{
      margin: 8px 0 8px;
      font-size: clamp(2rem, 5vw, 3.5rem);
      line-height: 1;
      letter-spacing: 0;
    }}
    h2 {{
      margin: 0;
      font-size: 1rem;
    }}
    p {{
      margin: 0;
      color: var(--muted);
      line-height: 1.6;
    }}
    .eyebrow {{
      display: inline-flex;
      border: 1px solid #cfe1d6;
      background: var(--green-soft);
      color: var(--green);
      border-radius: 6px;
      padding: 6px 10px;
      font-weight: 800;
      font-size: 0.78rem;
    }}
    .status {{
      border-radius: 8px;
      padding: 12px 14px;
      border: 1px solid {status_border(summary)};
      background: {status_background(summary)};
      color: {status_color(summary)};
      font-weight: 800;
      min-width: 160px;
      text-align: center;
    }}
    .grid {{
      display: grid;
      gap: 16px;
    }}
    .summary {{
      grid-template-columns: repeat(4, minmax(0, 1fr));
      margin-bottom: 16px;
    }}
    .panel {{
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 18px;
      box-shadow: var(--shadow);
    }}
    .metric-label {{
      color: var(--muted);
      font-weight: 800;
      font-size: 0.78rem;
      text-transform: uppercase;
    }}
    .metric-value {{
      margin-top: 10px;
      font-size: 2.1rem;
      font-weight: 900;
    }}
    .metric-detail {{
      margin-top: 4px;
      color: var(--muted);
      font-size: 0.92rem;
    }}
    .main-layout {{
      grid-template-columns: 0.88fr 1.12fr;
      align-items: stretch;
      margin-bottom: 16px;
    }}
    .donut-wrap {{
      display: grid;
      grid-template-columns: 190px 1fr;
      gap: 20px;
      align-items: center;
    }}
    .donut {{
      width: 180px;
      aspect-ratio: 1;
      border-radius: 50%;
      background: conic-gradient(var(--green) 0 {pass_rate:.2f}%, #e5e9df {pass_rate:.2f}% 100%);
      display: grid;
      place-items: center;
    }}
    .donut::after {{
      content: "{pass_rate:.0f}%";
      width: 112px;
      aspect-ratio: 1;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--panel);
      color: var(--ink);
      font-size: 2rem;
      font-weight: 900;
      border: 1px solid var(--line);
    }}
    .legend {{
      display: grid;
      gap: 8px;
      margin-top: 14px;
    }}
    .legend-row {{
      display: flex;
      justify-content: space-between;
      gap: 12px;
      font-weight: 800;
      border-bottom: 1px solid var(--line);
      padding-bottom: 8px;
    }}
    .bar-row {{
      display: grid;
      grid-template-columns: 150px 1fr 70px;
      align-items: center;
      gap: 12px;
      margin-top: 12px;
      font-size: 0.92rem;
      font-weight: 800;
    }}
    .track {{
      height: 12px;
      border-radius: 999px;
      background: #edf0e8;
      overflow: hidden;
    }}
    .fill {{
      height: 100%;
      border-radius: inherit;
      background: var(--green);
    }}
    .two-column {{
      grid-template-columns: 1fr 1fr;
      margin-bottom: 16px;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }}
    th {{
      text-align: left;
      color: var(--muted);
      text-transform: uppercase;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      padding: 10px;
      border-bottom: 1px solid var(--line);
      background: #fbfcf8;
    }}
    td {{
      padding: 10px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
    }}
    tr:last-child td {{ border-bottom: 0; }}
    .pill {{
      display: inline-flex;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 0.76rem;
      font-weight: 900;
      background: var(--green-soft);
      color: var(--green);
      white-space: nowrap;
    }}
    .pill.failed, .pill.error {{
      background: var(--red-soft);
      color: var(--red);
    }}
    .pill.skipped {{
      background: #f6eddb;
      color: var(--gold);
    }}
    .table-wrap {{
      overflow-x: auto;
    }}
    .footer-note {{
      margin-top: 18px;
      font-size: 0.9rem;
    }}
    code {{
      background: #edf0e8;
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 2px 6px;
      color: var(--ink);
    }}
    @media (max-width: 860px) {{
      header, .donut-wrap {{ display: block; }}
      .summary, .main-layout, .two-column {{ grid-template-columns: 1fr; }}
      .status {{ margin-top: 14px; text-align: left; }}
      .donut {{ margin: 18px 0; }}
      .bar-row {{ grid-template-columns: 1fr; gap: 6px; }}
    }}
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <span class="eyebrow">CARDI Test Dashboard</span>
        <h1>Core Module Test Results</h1>
        <p>Generated {escape(format_timestamp(metrics["generated_at"]))}. Standalone validation for GIS, gamification, farmer profile, and crop record rules.</p>
      </div>
      <div class="status">{escape(overall_status(summary))}</div>
    </header>

    <section class="grid summary" aria-label="Summary metrics">
      {metric_card("Total Tests", summary["total"], "Discovered standalone tests")}
      {metric_card("Passed", summary["passed"], "Successful assertions")}
      {metric_card("Total Time", f'{summary["total_elapsed_ms"]:.2f} ms', "End-to-end runner time")}
      {metric_card("Average", f'{summary["average_test_ms"]:.3f} ms', "Per-test execution time")}
    </section>

    <section class="grid main-layout">
      <div class="panel">
        <h2>Pass Rate</h2>
        <div class="donut-wrap">
          <div class="donut" aria-label="Pass rate {pass_rate:.0f} percent"></div>
          <div>
            <p>The standalone suite is grouped by functional area, with failures and errors surfaced separately from skipped tests.</p>
            <div class="legend">
              {legend_row("Passed", summary["passed"])}
              {legend_row("Failed", summary["failed"])}
              {legend_row("Errors", summary["errors"])}
              {legend_row("Skipped", summary["skipped"])}
            </div>
          </div>
        </div>
      </div>
      <div class="panel">
        <h2>Module Coverage and Runtime</h2>
        {group_bars(groups, max_group_duration, "duration_ms", "ms")}
      </div>
    </section>

    <section class="grid two-column">
      <div class="panel">
        <h2>Tests by Module</h2>
        {group_bars(groups, max_group_total, "total", "tests")}
      </div>
      <div class="panel">
        <h2>Slowest Tests</h2>
        {slowest_table(slowest)}
      </div>
    </section>

    <section class="panel">
      <h2>Detailed Test Results</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Module</th>
              <th>Test</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {test_rows(tests)}
          </tbody>
        </table>
      </div>
      <p class="footer-note">Run with <code>python3 -m tests.core_dashboard</code> from <code>backend/</code>. Metrics JSON is written beside this HTML file.</p>
    </section>
  </main>
</body>
</html>
"""


def status_border(summary: dict) -> str:
    return "#cfe1d6" if summary["failed"] == 0 and summary["errors"] == 0 else "#f0c2c2"


def status_background(summary: dict) -> str:
    return "#e8f4ed" if summary["failed"] == 0 and summary["errors"] == 0 else "#fae8e8"


def status_color(summary: dict) -> str:
    return "#2f7653" if summary["failed"] == 0 and summary["errors"] == 0 else "#be3b3b"


def overall_status(summary: dict) -> str:
    if summary["errors"]:
        return f"{summary['errors']} error(s)"
    if summary["failed"]:
        return f"{summary['failed']} failure(s)"
    return "All tests passed"


def metric_card(label: str, value: object, detail: str) -> str:
    return f"""
      <article class="panel">
        <div class="metric-label">{escape(label)}</div>
        <div class="metric-value">{escape(str(value))}</div>
        <div class="metric-detail">{escape(detail)}</div>
      </article>
    """


def legend_row(label: str, value: object) -> str:
    return f'<div class="legend-row"><span>{escape(label)}</span><span>{escape(str(value))}</span></div>'


def group_bars(groups: list[dict], max_value: float, metric: str, suffix: str) -> str:
    rows = []
    for group in groups:
        value = float(group[metric])
        width = 0 if max_value == 0 else max(2, min(100, value / max_value * 100))
        display = f"{value:.3f} {suffix}" if suffix == "ms" else f"{int(value)} {suffix}"
        rows.append(
            f"""
            <div class="bar-row">
              <span>{escape(group["name"])}</span>
              <div class="track"><div class="fill" style="width: {width:.2f}%"></div></div>
              <span>{escape(display)}</span>
            </div>
            """
        )
    return "\n".join(rows)


def slowest_table(records: list[dict]) -> str:
    if not records:
        return "<p>No tests were recorded.</p>"
    rows = "\n".join(
        f"""
        <tr>
          <td>{escape(record["group"])}</td>
          <td>{escape(record["test_name"])}</td>
          <td>{record["elapsed_ms"]:.3f} ms</td>
        </tr>
        """
        for record in records
    )
    return f"""
      <div class="table-wrap">
        <table>
          <thead><tr><th>Module</th><th>Test</th><th>Duration</th></tr></thead>
          <tbody>{rows}</tbody>
        </table>
      </div>
    """


def test_rows(records: list[dict]) -> str:
    return "\n".join(
        f"""
        <tr>
          <td><span class="pill {escape(record["status"])}">{escape(record["status"].upper())}</span></td>
          <td>{escape(record["group"])}</td>
          <td>{escape(record["test_name"])}</td>
          <td>{record["elapsed_ms"]:.3f} ms</td>
        </tr>
        """
        for record in records
    )


def format_timestamp(value: str) -> str:
    try:
        timestamp = datetime.fromisoformat(value)
    except ValueError:
        return value
    return timestamp.strftime("%Y-%m-%d %H:%M:%S UTC")


def escape(value: str) -> str:
    return html.escape(value, quote=True)


def write_dashboard(metrics: dict, output_path: Path) -> tuple[Path, Path]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    html_path = output_path.resolve()
    json_path = html_path.with_suffix(".json")
    html_path.write_text(render_dashboard(metrics), encoding="utf-8")
    json_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return html_path, json_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Run CARDI standalone tests and generate an HTML dashboard.")
    parser.add_argument("--module", default=DEFAULT_TEST_MODULE, help=f"Test module to run. Default: {DEFAULT_TEST_MODULE}")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help=f"HTML output path. Default: {DEFAULT_OUTPUT}")
    parser.add_argument("--open", action="store_true", help="Open the generated dashboard in the default browser.")
    parser.add_argument("-v", "--verbosity", type=int, default=1, help="unittest verbosity. Default: 1")
    args = parser.parse_args(argv)

    result, elapsed_ms = run_tests(args.module, args.verbosity)
    metrics = build_metrics(result.records, elapsed_ms)
    html_path, json_path = write_dashboard(metrics, args.output)

    print(f"\nDashboard written: {html_path}")
    print(f"Metrics written:   {json_path}")

    if args.open:
        webbrowser.open(html_path.as_uri())

    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
