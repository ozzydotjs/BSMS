import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { initSync } from '@sipemu/anofox-forecast';
import {
  aggregateMonthlyAnalytics,
  computeAccuracyMetrics,
  computeTrailingMovingAverage,
  filterAnalyticsByDocumentCategory,
  incrementMonth,
  markForecastWasmInitialized,
  runForecastPipeline,
} from './forecasting';
import type { DocumentType, MonthlyRequestAnalytic } from '../types/database';

const wasmPath = path.resolve(
  process.cwd(),
  'node_modules/@sipemu/anofox-forecast/anofox_forecast_js_bg.wasm'
);
initSync({ module: fs.readFileSync(wasmPath) });
markForecastWasmInitialized();

test('aggregateMonthlyAnalytics sums across document types and sorts chronologically', () => {
  const rows: MonthlyRequestAnalytic[] = [
    { request_month: '2026-03', document_type_id: 'doc-1', total_requests: 20 },
    { request_month: '2026-01', document_type_id: 'doc-1', total_requests: 15 },
    { request_month: '2026-01', document_type_id: 'doc-2', total_requests: 10 },
    { request_month: '2026-02', document_type_id: 'doc-1', total_requests: 18 },
  ];

  const aggregated = aggregateMonthlyAnalytics(rows);
  assert.deepEqual(aggregated, [
    { month: '2026-01', total: 25 },
    { month: '2026-02', total: 18 },
    { month: '2026-03', total: 20 },
  ]);
});

test('incrementMonth advances YYYY-MM across year boundaries', () => {
  assert.equal(incrementMonth('2026-11', 1), '2026-12');
  assert.equal(incrementMonth('2026-11', 2), '2027-01');
  assert.equal(incrementMonth('2026-11', 3), '2027-02');
});

test('computeTrailingMovingAverage computes 3-month trailing mean', () => {
  const ma = computeTrailingMovingAverage([10, 20, 30, 40, 50], 3);
  assert.deepEqual(ma, [null, null, 20, 30, 40]);
});

test('computeAccuracyMetrics computes MAE, RMSE, and MAPE accurately', () => {
  const metrics = computeAccuracyMetrics([100, 200], [110, 180]);
  assert.equal(metrics.mae, 15);
  assert.equal(metrics.rmse, 15.81);
  assert.equal(metrics.mape, 10);
});

test('runForecastPipeline fits HoltWintersForecaster and predicts 3 future months', async () => {
  const months = [
    '2025-09', '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03', '2026-04',
    '2026-05', '2026-06', '2026-07', '2026-08',
    '2026-09', '2026-10', '2026-11',
  ];
  const counts = [44, 49, 56, 52, 60, 68, 63, 72, 81, 75, 84, 92, 88, 95, 104];
  const rows: MonthlyRequestAnalytic[] = months.map((m, idx) => ({
    request_month: m,
    document_type_id: 'doc-1',
    total_requests: counts[idx],
  }));

  const result = await runForecastPipeline(rows);
  assert.equal(result.nextMonths.length, 3);
  assert.equal(result.nextMonths[0].month, '2026-12');
  assert.equal(result.nextMonths[1].month, '2027-01');
  assert.equal(result.nextMonths[2].month, '2027-02');
  assert.equal(result.chartData.length, months.length + 3);
  assert.ok(result.evaluationCount > 0);
  assert.ok(result.holtWintersMetrics.mae >= 0);
  assert.ok(result.movingAverageMetrics.rmse >= 0);
});

test('filterAnalyticsByDocumentCategory filters rows by document category', () => {
  const docTypes: DocumentType[] = [
    { id: 'dt-1', name: 'Barangay Clearance', fee: 50, processing_days: 1 },
    { id: 'dt-2', name: 'Certificate of Residency', fee: 30, processing_days: 1 },
    { id: 'dt-3', name: 'Certificate of Indigency', fee: 0, processing_days: 1 },
  ];
  const rows: MonthlyRequestAnalytic[] = [
    { request_month: '2026-01', document_type_id: 'dt-1', total_requests: 12 },
    { request_month: '2026-01', document_type_id: 'dt-2', total_requests: 8 },
    { request_month: '2026-01', document_type_id: 'dt-3', total_requests: 5 },
  ];

  assert.equal(filterAnalyticsByDocumentCategory(rows, docTypes, 'all').length, 3);
  assert.deepEqual(
    filterAnalyticsByDocumentCategory(rows, docTypes, 'clearance').map((r) => r.document_type_id),
    ['dt-1']
  );
  assert.deepEqual(
    filterAnalyticsByDocumentCategory(rows, docTypes, 'residency').map((r) => r.document_type_id),
    ['dt-2']
  );
  assert.deepEqual(
    filterAnalyticsByDocumentCategory(rows, docTypes, 'indigency').map((r) => r.document_type_id),
    ['dt-3']
  );
});
