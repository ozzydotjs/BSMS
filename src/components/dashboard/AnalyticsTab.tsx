import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Filter } from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DocumentType, MonthlyRequestAnalytic } from '../../types/database';
import {
  filterAnalyticsByDocumentCategory,
  runForecastPipeline,
  type DocumentFilterCategory,
  type ForecastAnalysisResult,
} from '../../utils/forecasting';
import { ChartSkeleton, TableSkeleton } from '../SkeletonLoader';

interface AnalyticsTabProps {
  loading: boolean;
  monthlyAnalytics: MonthlyRequestAnalytic[];
  documentTypes: DocumentType[];
}

interface CustomTooltipPayloadItem {
  name?: string;
  value?: number | null;
  color?: string;
  dataKey?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
}

const FILTER_OPTIONS: { value: DocumentFilterCategory; label: string }[] = [
  { value: 'all', label: 'All Document Types' },
  { value: 'clearance', label: 'Clearance' },
  { value: 'residency', label: 'Residency' },
  { value: 'indigency', label: 'Indigency' },
];

function ForecastChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const entries = payload.filter(
    (item) => item.value !== null && item.value !== undefined
  );
  if (entries.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-lg text-xs">
      <p className="font-display font-semibold text-slate-900 mb-2">{label}</p>
      <div className="space-y-1.5">
        {entries.map((entry) => (
          <div key={String(entry.dataKey)} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-2 text-slate-600">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: entry.color }}
                aria-hidden="true"
              />
              <span>{entry.name}</span>
            </span>
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {entry.value} reqs
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsTab({
  loading,
  monthlyAnalytics,
  documentTypes,
}: AnalyticsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<DocumentFilterCategory>('all');
  const [forecastResult, setForecastResult] = useState<ForecastAnalysisResult | null>(null);
  const [computing, setComputing] = useState(false);
  const [computeError, setComputeError] = useState<string | null>(null);

  const filteredRows = useMemo(
    () =>
      filterAnalyticsByDocumentCategory(
        monthlyAnalytics,
        documentTypes,
        selectedCategory
      ),
    [monthlyAnalytics, documentTypes, selectedCategory]
  );

  useEffect(() => {
    let cancelled = false;
    if (loading) return;

    async function compute() {
      setComputing(true);
      setComputeError(null);
      try {
        const result = await runForecastPipeline(filteredRows);
        if (!cancelled) {
          setForecastResult(result);
        }
      } catch (err) {
        if (!cancelled) {
          setComputeError(
            err instanceof Error ? err.message : 'Unable to execute Holt-Winters forecast.'
          );
        }
      } finally {
        if (!cancelled) {
          setComputing(false);
        }
      }
    }

    compute();
    return () => {
      cancelled = true;
    };
  }, [loading, filteredRows]);

  const filterToolbar = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Filter className="h-4 w-4 text-[#1e3a8a]" aria-hidden="true" />
        <label htmlFor="analytics-doc-filter">Filter by Document Type:</label>
      </div>
      <select
        id="analytics-doc-filter"
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value as DocumentFilterCategory)}
        className="w-full sm:w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20"
      >
        {FILTER_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading || computing) {
    return (
      <div className="space-y-6">
        {filterToolbar}
        <ChartSkeleton />
        <TableSkeleton rows={2} columns={4} />
      </div>
    );
  }

  if (computeError) {
    return (
      <div className="space-y-6">
        {filterToolbar}
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800">
          {computeError}
        </div>
      </div>
    );
  }

  if (!forecastResult || forecastResult.chartData.length === 0) {
    return (
      <div className="space-y-6">
        {filterToolbar}
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-sm">
          <BarChart3 className="mx-auto h-10 w-10 text-slate-300" aria-hidden="true" />
          <h2 className="mt-3 font-display text-base font-semibold text-slate-900">
            No Monthly Analytics Available
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            No records in monthly_request_analytics matched the selected document filter.
          </p>
        </div>
      </div>
    );
  }

  const { chartData, nextMonths, holtWintersMetrics, movingAverageMetrics, evaluationCount } =
    forecastResult;

  return (
    <div className="space-y-6">
      {filterToolbar}

      {/* ComposedChart Card */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Monthly Document Request Volume & 3-Month Forecast
            </h2>
            <p className="text-xs text-slate-500">
              Aggregated from monthly_request_analytics ({FILTER_OPTIONS.find((o) => o.value === selectedCategory)?.label})
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono tabular-nums lg:flex-nowrap shrink-0 whitespace-nowrap">
            <span className="font-sans font-medium text-slate-500 mr-1">Next 3 Months:</span>
            {nextMonths.map((item, idx) => (
              <span key={item.month} className="inline-flex items-center gap-2">
                {idx > 0 && <span aria-hidden="true" className="text-slate-300">·</span>}
                <span>
                  <span className="text-violet-700 font-medium">{item.month}:</span>{' '}
                  <strong className="font-semibold text-slate-900">{item.predicted}</strong>
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 18, left: 0, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<ForecastChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                iconType="plainline"
              />
              <Line
                type="monotone"
                dataKey="historical"
                name="Historical Requests"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 0 }}
                activeDot={{ r: 5.5, fill: '#1e3a8a' }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="movingAverage"
                name="3-Month Moving Average"
                stroke="#64748b"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="holtWintersForecast"
                name="Holt-Winters Forecast"
                stroke="#7c3aed"
                strokeWidth={2.5}
                strokeDasharray="2 5"
                dot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#5b21b6' }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Model Comparison Metrics Table */}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-display text-sm font-semibold text-slate-900">
            Forecast Accuracy Comparison (Rolling Out-of-Sample Evaluation)
          </h3>
          <span className="text-xs text-slate-500 tabular-nums">
            Evaluated across {evaluationCount} historical test months
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-5 py-3">
                  Forecasting Model
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  MAE (Requests)
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  RMSE (Requests)
                </th>
                <th scope="col" className="px-5 py-3 text-right">
                  MAPE (%)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr className="bg-violet-50/30">
                <td className="px-5 py-3.5 font-medium text-slate-900">
                  Holt-Winters Exponential Smoothing
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-slate-800 tabular-nums">
                  {holtWintersMetrics.mae.toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-slate-800 tabular-nums">
                  {holtWintersMetrics.rmse.toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-slate-800 tabular-nums">
                  {holtWintersMetrics.mape.toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-medium text-slate-700">
                  3-Month Moving Average Baseline
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-slate-600 tabular-nums">
                  {movingAverageMetrics.mae.toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-slate-600 tabular-nums">
                  {movingAverageMetrics.rmse.toFixed(2)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-slate-600 tabular-nums">
                  {movingAverageMetrics.mape.toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm leading-relaxed text-slate-600">
          <strong className="font-semibold text-slate-800">What these metrics mean for Barangay Sugcad:</strong>{' '}
          <strong>MAE</strong> (Mean Absolute Error) shows the average monthly error in raw document request counts, helping the Barangay Secretary plan clerk staffing and official security paper stock within a predictable margin.{' '}
          <strong>RMSE</strong> (Root Mean Squared Error) penalizes larger spikes—such as annual business clearance renewals or enrollment months—more heavily, indicating how resilient the model is during peak queues.{' '}
          <strong>MAPE</strong> (Mean Absolute Percentage Error) expresses the error relative to total monthly volume; lower values across all three metrics mean the Holt-Winters model captures seasonal and upward filing trends more reliably than a simple 3-month moving average.
        </p>
      </section>
    </div>
  );
}
