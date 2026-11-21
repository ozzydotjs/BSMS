import init, { TimeSeries, HoltWintersForecaster } from '@sipemu/anofox-forecast';
import type { DocumentType, MonthlyRequestAnalytic } from '../types/database';

export type DocumentFilterCategory = 'all' | 'clearance' | 'residency' | 'indigency';

export function filterAnalyticsByDocumentCategory(
  rows: MonthlyRequestAnalytic[],
  documentTypes: DocumentType[],
  category: DocumentFilterCategory
): MonthlyRequestAnalytic[] {
  if (category === 'all') return rows;

  const matchingIds = new Set(
    documentTypes
      .filter((dt) => dt.name.toLowerCase().includes(category))
      .map((dt) => dt.id)
  );

  return rows.filter((row) => matchingIds.has(row.document_type_id));
}

export interface MonthlyTotalPoint {
  month: string;
  total: number;
}

export interface ForecastChartPoint {
  month: string;
  label: string;
  historical: number | null;
  movingAverage: number | null;
  holtWintersForecast: number | null;
}

export interface AccuracyMetrics {
  mae: number;
  rmse: number;
  mape: number;
}

export interface ForecastAnalysisResult {
  chartData: ForecastChartPoint[];
  nextMonths: { month: string; predicted: number }[];
  holtWintersMetrics: AccuracyMetrics;
  movingAverageMetrics: AccuracyMetrics;
  evaluationCount: number;
  seasonalPeriod: number;
}

let wasmInitialized = false;

export async function ensureForecastWasm(): Promise<void> {
  if (!wasmInitialized) {
    await init();
    wasmInitialized = true;
  }
}

export function markForecastWasmInitialized(): void {
  wasmInitialized = true;
}

export function aggregateMonthlyAnalytics(rows: MonthlyRequestAnalytic[]): MonthlyTotalPoint[] {
  const monthTotals = new Map<string, number>();

  for (const row of rows) {
    if (!row.request_month) continue;
    const prev = monthTotals.get(row.request_month) ?? 0;
    monthTotals.set(row.request_month, prev + Number(row.total_requests || 0));
  }

  return Array.from(monthTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
}

export function incrementMonth(yyyyMm: string, offset: number): string {
  const match = /^(\d{4})-(\d{2})$/.exec(yyyyMm);
  if (!match) return `+${offset}M`;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const totalMonths = year * 12 + monthIndex + offset;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (totalMonths % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
}

export function formatMonthLabel(yyyyMm: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(yyyyMm);
  if (!match) return yyyyMm;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export function computeTrailingMovingAverage(values: number[], windowSize = 3): (number | null)[] {
  return values.map((_, idx) => {
    if (idx < windowSize - 1) return null;
    let sum = 0;
    for (let j = idx - windowSize + 1; j <= idx; j++) {
      sum += values[j];
    }
    return Math.round((sum / windowSize) * 10) / 10;
  });
}

export function computeAccuracyMetrics(actuals: number[], predictions: number[]): AccuracyMetrics {
  const n = Math.min(actuals.length, predictions.length);
  if (n === 0) {
    return { mae: 0, rmse: 0, mape: 0 };
  }

  let absErrSum = 0;
  let sqErrSum = 0;
  let pctErrSum = 0;
  let pctCount = 0;

  for (let i = 0; i < n; i++) {
    const actual = actuals[i];
    const pred = predictions[i];
    const err = actual - pred;
    const absErr = Math.abs(err);
    absErrSum += absErr;
    sqErrSum += err * err;
    if (actual !== 0) {
      pctErrSum += (absErr / Math.abs(actual)) * 100;
      pctCount += 1;
    }
  }

  return {
    mae: Math.round((absErrSum / n) * 100) / 100,
    rmse: Math.round(Math.sqrt(sqErrSum / n) * 100) / 100,
    mape: pctCount > 0 ? Math.round((pctErrSum / pctCount) * 100) / 100 : 0,
  };
}

function selectSeasonalPeriod(length: number): number {
  if (length >= 24) return 12;
  if (length >= 8) return 4;
  if (length >= 4) return 2;
  return 1;
}

function fitAndPredictHoltWinters(values: number[], period: number, horizon: number): number[] {
  const ts = new TimeSeries(new Float64Array(values));
  let model: HoltWintersForecaster | null = null;
  let forecastObj: ReturnType<HoltWintersForecaster['predict']> | null = null;

  try {
    try {
      model = HoltWintersForecaster.auto(period, 'additive');
      model.fit(ts);
    } catch {
      if (model) {
        model.free();
        model = null;
      }
      model = new HoltWintersForecaster(0.35, 0.15, 0.2, Math.max(1, period));
      model.fit(ts);
    }
    forecastObj = model.predict(horizon);
    return Array.from(forecastObj.values).map((v) => Math.max(0, Math.round(v * 10) / 10));
  } finally {
    if (forecastObj) forecastObj.free();
    if (model) model.free();
    ts.free();
  }
}

export async function runForecastPipeline(rows: MonthlyRequestAnalytic[]): Promise<ForecastAnalysisResult> {
  await ensureForecastWasm();

  const monthly = aggregateMonthlyAnalytics(rows);
  if (monthly.length === 0) {
    return {
      chartData: [],
      nextMonths: [],
      holtWintersMetrics: { mae: 0, rmse: 0, mape: 0 },
      movingAverageMetrics: { mae: 0, rmse: 0, mape: 0 },
      evaluationCount: 0,
      seasonalPeriod: 1,
    };
  }

  const values = monthly.map((m) => m.total);
  const period = selectSeasonalPeriod(values.length);
  const trailingMA = computeTrailingMovingAverage(values, 3);

  let futureValues: number[];
  if (values.length >= 2) {
    futureValues = fitAndPredictHoltWinters(values, period, 3);
  } else {
    futureValues = [values[0], values[0], values[0]];
  }

  const lastMonth = monthly[monthly.length - 1].month;
  const nextMonths = futureValues.map((predicted, idx) => ({
    month: incrementMonth(lastMonth, idx + 1),
    predicted,
  }));

  // Rolling 1-step-ahead out-of-sample evaluation for Holt-Winters vs 3-month MA baseline
  const minTrainSize = Math.max(4, Math.min(values.length - 1, Math.max(period + 2, 6)));
  const evalActuals: number[] = [];
  const hwEvalPreds: number[] = [];
  const maEvalPreds: number[] = [];

  if (values.length > minTrainSize) {
    for (let t = minTrainSize; t < values.length; t++) {
      const trainSlice = values.slice(0, t);
      const trainPeriod = selectSeasonalPeriod(trainSlice.length);
      const hwNext = fitAndPredictHoltWinters(trainSlice, trainPeriod, 1)[0];
      const maNext =
        (trainSlice[t - 1] + trainSlice[t - 2] + trainSlice[t - 3]) / 3;

      evalActuals.push(values[t]);
      hwEvalPreds.push(hwNext);
      maEvalPreds.push(Math.round(maNext * 10) / 10);
    }
  }

  const holtWintersMetrics = computeAccuracyMetrics(evalActuals, hwEvalPreds);
  const movingAverageMetrics = computeAccuracyMetrics(evalActuals, maEvalPreds);

  const chartData: ForecastChartPoint[] = monthly.map((item, idx) => ({
    month: item.month,
    label: formatMonthLabel(item.month),
    historical: item.total,
    movingAverage: trailingMA[idx],
    // Anchor dotted forecast line smoothly at the final historical month
    holtWintersForecast: idx === monthly.length - 1 ? item.total : null,
  }));

  for (const future of nextMonths) {
    chartData.push({
      month: future.month,
      label: formatMonthLabel(future.month),
      historical: null,
      movingAverage: null,
      holtWintersForecast: future.predicted,
    });
  }

  return {
    chartData,
    nextMonths,
    holtWintersMetrics,
    movingAverageMetrics,
    evaluationCount: evalActuals.length,
    seasonalPeriod: period,
  };
}
