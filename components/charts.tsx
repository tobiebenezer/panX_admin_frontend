'use client';

/* Chart.js wrappers with Zentic theme awareness. Charts re-theme when the
 * data-theme attribute changes (Shell dispatches 'pae-theme' on toggle). */

import { useEffect, useRef } from 'react';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip,
  ChartConfiguration,
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  BarController,
  BarElement,
  DoughnutController,
  ArcElement,
  LinearScale,
  CategoryScale,
  Filler,
  Legend,
  Tooltip
);

export const ZC_PRIMARY = '#16B364';

export function isDark(): boolean {
  return typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
}

function tickColor(): string {
  return isDark() ? '#94A3B8' : '#6B7280';
}
function gridColor(): string {
  return isDark() ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)';
}

function useChart(build: (ctx: CanvasRenderingContext2D) => ChartConfiguration, deps: unknown[]) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const chart = new Chart(canvas, build(canvas.getContext('2d')!));
    chartRef.current = chart;
    const retheme = () => {
      const c = chartRef.current;
      if (!c) return;
      const tc = tickColor();
      const gc = gridColor();
      Object.values(c.scales).forEach((s) => {
        const opts = s.options as { ticks?: { color?: string }; grid?: { color?: string } };
        if (opts.ticks) opts.ticks.color = tc;
        if (opts.grid) opts.grid.color = gc;
      });
      c.update();
    };
    window.addEventListener('pae-theme', retheme);
    return () => {
      window.removeEventListener('pae-theme', retheme);
      chart.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvasRef;
}

export function LineChart({
  labels,
  data,
  label = 'Volume',
  color = ZC_PRIMARY,
  height,
}: {
  labels: string[];
  data: number[];
  label?: string;
  color?: string;
  height?: string;
}) {
  const ref = useChart(
    () => ({
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label,
            data,
            borderColor: color,
            backgroundColor: `${color}1A`, // ~10% opacity
            fill: true,
            tension: 0.35,
            borderWidth: 2,
            pointRadius: data.length > 30 ? 0 : 3,
            pointHoverRadius: 5,
            pointBackgroundColor: color,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0F172A',
            padding: 10,
            cornerRadius: 8,
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: tickColor() } },
          y: { grid: { color: gridColor() }, ticks: { color: tickColor() } },
        },
      },
    }),
    [labels, data, label, color]
  );
  return <canvas ref={ref} />;
}

/* Minimalist sparkline for trader watchlists and quick KPI tiles */
export function Sparkline({
  data,
  color = '#16B364',
  height = 36,
  width = 90,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
}) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}


export function BarChart({
  labels,
  data,
  label = 'Value',
  color = ZC_PRIMARY,
}: {
  labels: string[];
  data: number[];
  label?: string;
  color?: string;
}) {
  const ref = useChart(
    () => ({
      type: 'bar',
      data: {
        labels,
        datasets: [{ label, data, backgroundColor: color, borderRadius: 6, maxBarThickness: 34 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: tickColor() } },
          y: { grid: { color: gridColor() }, ticks: { color: tickColor() }, beginAtZero: true },
        },
      },
    }),
    [labels, data, label, color]
  );
  return <canvas ref={ref} />;
}

export function DoughnutChart({ labels, values, colors }: { labels: string[]; values: number[]; colors: string[] }) {
  const ref = useChart(
    () => ({
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 0, cutout: '68%' }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    }),
    [labels, values, colors]
  );
  return <canvas ref={ref} />;
}
