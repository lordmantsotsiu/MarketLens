'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { ChartPoint } from '@/lib/types';

interface MarketChartProps {
  data: ChartPoint[];
  title?: string;
}

export const MarketChart: React.FC<MarketChartProps> = ({ data, title }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Bail out (instead of throwing) if the container collapsed to zero size
    // — e.g. before layout settles or inside a hidden container.
    if (container.clientWidth === 0 || container.clientHeight === 0) return;

    let chart: IChartApi | null = null;
    try {
      chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: '#0f172a' },
          textColor: '#94a3b8',
        },
        width: container.clientWidth,
        height: 300,
        grid: {
          vertLines: { color: '#1e293b' },
          horzLines: { color: '#1e293b' },
        },
      });

      const areaSeries: ISeriesApi<'Area'> = chart.addAreaSeries({
        lineColor: '#3b82f6',
        topColor: 'rgba(59,130,246,0.4)',
        bottomColor: 'rgba(59,130,246,0.0)',
        lineWidth: 2,
      });

      // Sort + dedupe defensively. lightweight-charts throws on duplicate or
      // non-ascending timestamps — a crash here used to take down the whole
      // page because no error boundary existed.
      const sanitized = [...data]
        .filter((p) => p && Number.isFinite(p.value))
        .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0))
        .filter((p, i, arr) => i === 0 || p.time !== arr[i - 1].time);

      if (sanitized.length > 0) {
        areaSeries.setData(sanitized as never);
        chart.timeScale().fitContent();
      }
    } catch (error) {
      // Never let chart initialization break the page.
      console.error('MarketChart: failed to initialize chart', error);
      try {
        chart?.remove();
      } catch {
        // ignore double-dispose
      }
      chart = null;
    }

    const handleResize = () => {
      if (chart && chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      try {
        chart?.remove();
      } catch {
        // chart already disposed — safe to ignore
      }
    };
  }, [data]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
      {title && <h3 className="text-sm font-medium text-slate-400 mb-3">{title}</h3>}
      {data.length === 0 ? (
        <div className="w-full h-[300px] flex items-center justify-center text-sm text-slate-500">
          No trend data available
        </div>
      ) : (
        <div ref={chartContainerRef} className="w-full h-[300px]" />
      )}
    </div>
  );
};
