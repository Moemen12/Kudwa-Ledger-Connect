CREATE TABLE IF NOT EXISTS integration_runs (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  generated_at TEXT,
  currency TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS source_imports (
  run_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  system TEXT NOT NULL,
  report_name TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  currency TEXT NOT NULL,
  rows_imported INTEGER NOT NULL,
  periods_imported INTEGER NOT NULL,
  PRIMARY KEY (run_id, source_id),
  FOREIGN KEY (run_id) REFERENCES integration_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report_periods (
  run_id TEXT NOT NULL,
  period_id TEXT NOT NULL,
  label TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  PRIMARY KEY (run_id, period_id),
  FOREIGN KEY (run_id) REFERENCES integration_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report_rows (
  run_id TEXT NOT NULL,
  row_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  parent_row_id TEXT,
  label TEXT NOT NULL,
  kind TEXT NOT NULL,
  depth INTEGER NOT NULL,
  sort_order INTEGER NOT NULL,
  PRIMARY KEY (run_id, row_id),
  FOREIGN KEY (run_id) REFERENCES integration_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report_values (
  run_id TEXT NOT NULL,
  row_id TEXT NOT NULL,
  period_id TEXT NOT NULL,
  value REAL NOT NULL,
  PRIMARY KEY (run_id, row_id, period_id),
  FOREIGN KEY (run_id) REFERENCES integration_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source_row_mappings (
  run_id TEXT NOT NULL,
  row_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  external_id TEXT,
  source_group TEXT,
  PRIMARY KEY (run_id, row_id),
  FOREIGN KEY (run_id) REFERENCES integration_runs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_integration_runs_created_at
  ON integration_runs(created_at);

CREATE INDEX IF NOT EXISTS idx_report_periods_run_starts_on
  ON report_periods(run_id, starts_on);

CREATE INDEX IF NOT EXISTS idx_report_rows_run_sort_order
  ON report_rows(run_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_report_values_run_row
  ON report_values(run_id, row_id);
