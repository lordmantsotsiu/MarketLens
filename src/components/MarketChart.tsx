import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';
import { ChartPoint } from '@/lib/types';

interface MarketChartProps {
  data: ChartPoint[];
  title?: string;
}

export const MarketChart: React.FC<MarketChartProps> = ({ data, title }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart: IChartApi = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#94a3b8',
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
    });

    // In lightweight-charts v4.x, area series are initialized via chart.addAreaSeries()
    const areaSeries = chart.addAreaSeries({
      lineColor: '#3b82f6',
      topColor: 'rgba(59, 130, 246, 0.4)',
      bottomColor: 'rgba(59, 130, 246, 0.0)',
      lineWidth: 2,
    });

    areaSeries.setData(data as any);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
      {title && <h3 className="text-sm font-medium text-slate-400 mb-3">{title}</h3>}
      <div ref={chartContainerRef} className="w-full h-[300px]" />
    </div>
  );
};