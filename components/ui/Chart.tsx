'use client';

import { forwardRef, type HTMLAttributes, useRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ChartProps extends HTMLAttributes<HTMLDivElement> {
  type: 'line' | 'area' | 'bar' | 'radial' | 'donut';
  data: unknown[];
  xKey?: string;
  yKeys?: string | string[];
  height?: number;
  width?: number;
  colors?: string[];
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  className?: string;
  children?: ReactNode;
}

export const Chart = forwardRef<HTMLDivElement, ChartProps>(
  (
    {
      type,
      data,
      xKey,
      yKeys,
      height = 300,
      width,
      colors = ['var(--nano-blue)', 'var(--signal-red)', 'var(--deep-blue)', 'var(--emerald-500)', 'var(--amber-500)'],
      showGrid = true,
      showTooltip = true,
      showLegend = false,
      animate = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      if (!canvasRef.current || !containerRef.current) return;
      if (!data || data.length === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = containerRef.current.getBoundingClientRect();
      const w = width || rect.width;
      const h = height;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, w, h);

      const padding = { top: 20, right: 30, bottom: 40, left: 50 };
      const chartW = w - padding.left - padding.right;
      const chartH = h - padding.top - padding.bottom;

      const yValues = data.flatMap((d: unknown) => {
        const obj = d as Record<string, unknown>;
        const keys = Array.isArray(yKeys) ? yKeys : [yKeys || 'value'];
        return keys.map((k) => Number(obj[k] ?? 0));
      });
      const minY = Math.min(0, ...yValues);
      const maxY = Math.max(...yValues);
      const yRange = maxY - minY || 1;

      const xValues = data.map((d: unknown) => Number((d as Record<string, unknown>)[xKey || 'x'] ?? 0));
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const xRange = maxX - minX || 1;

      const keys = Array.isArray(yKeys) ? yKeys : [yKeys || 'value'];

      if (showGrid) {
        ctx.strokeStyle = 'var(--border)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        for (let i = 0; i <= 4; i++) {
          const y = padding.top + (chartH / 4) * i;
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(padding.left + chartW, y);
          ctx.stroke();

          const val = maxY - (yRange / 4) * i;
          ctx.fillStyle = 'var(--muted)';
          ctx.font = '11px Inter, system-ui';
          ctx.textAlign = 'right';
          ctx.fillText(val.toFixed(val > 100 ? 0 : 1), padding.left - 8, y + 4);
        }

        ctx.setLineDash([]);
      }

      const keyColors = keys.map((_, i) => colors[i % colors.length]);

      keys.forEach((key, keyIndex) => {
        const color = keyColors[keyIndex];
        const points = data.map((d: unknown, i: number) => {
          const obj = d as Record<string, unknown>;
          const x = padding.left + ((Number(obj[xKey || 'x'] ?? 0) - minX) / xRange) * chartW;
          const y = padding.top + chartH - ((Number(obj[key] ?? 0) - minY) / yRange) * chartH;
          return { x, y };
        });

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (type === 'area') {
          const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
          gradient.addColorStop(0, `${color}33`);
          gradient.addColorStop(1, `${color}00`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.moveTo(points[0].x, padding.top + chartH);
          points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
          ctx.closePath();
          ctx.fill();
        }

        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        if (type !== 'line' && type !== 'area') {
          ctx.fillStyle = color;
          points.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });

      if (showLegend && keys.length > 1) {
        ctx.font = '12px Inter, system-ui';
        ctx.textAlign = 'left';
        keys.forEach((key, i) => {
          const x = padding.left + (i * 120);
          const y = padding.top - 16;
          ctx.fillStyle = keyColors[i];
          ctx.fillRect(x, y, 12, 12);
          ctx.fillStyle = 'var(--foreground)';
          ctx.fillText(String(key), x + 18, y + 10);
        });
      }
    }, [data, type, xKey, yKeys, height, width, colors, showGrid, showLegend, animate]);

    return (
      <div
        ref={containerRef}
        className={cn('relative', className)}
        style={{ width: width || '100%', height }}
        {...props}
      >
        <canvas ref={canvasRef} aria-hidden="true" />
        {children}
      </div>
    );
  }
);

Chart.displayName = 'Chart';