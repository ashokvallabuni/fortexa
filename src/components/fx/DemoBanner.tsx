import { AlertTriangle } from 'lucide-react';

export function DemoBanner() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-xs font-mono">
      <AlertTriangle className="size-3 shrink-0" />
      <span>DEMO MODE — SYNTHETIC DATA — Not representative of real-world accuracy</span>
    </div>
  );
}
