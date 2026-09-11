import { Activity, BrainCircuit, GitBranch, MessageSquare, Microscope } from 'lucide-react';

type Feature = 'graph' | 'explainability' | 'evaluation' | 'world-model' | 'copilot';
const content: Record<Feature, { title: string; eyebrow: string; description: string; icon: typeof Activity }> = {
  graph: { title: 'Network Graph', eyebrow: 'Network intelligence', description: 'The topology view will populate from authorized network entities and graph edges after telemetry processing completes.', icon: GitBranch },
  explainability: { title: 'Explainability', eyebrow: 'Model analysis', description: 'SHAP and attention explanations will appear here when a real forecast result and explanation artifact are available.', icon: Microscope },
  evaluation: { title: 'Forecast Evaluation', eyebrow: 'Research', description: 'Evaluation metrics require a completed run against a validated labeled dataset. No synthetic metrics are displayed.', icon: Activity },
  'world-model': { title: 'World Model', eyebrow: 'AI engine', description: 'World-model state transitions and model versions will appear after the connected inference service registers them.', icon: BrainCircuit },
  copilot: { title: 'SOC Copilot', eyebrow: 'Security operations', description: 'Copilot responses require the configured analysis service and authorized incident context.', icon: MessageSquare },
};

export function LiveFeatureEmptyPage({ feature }: { feature: Feature }) {
  const view = content[feature];
  const Icon = view.icon;
  return <main className="mx-auto max-w-5xl space-y-5 p-4 text-[var(--foreground)] md:p-7"><header className="border-b border-[var(--border)] pb-5"><p className="text-[10px] uppercase tracking-[.2em] text-blue-600">{view.eyebrow}</p><h1 className="mt-2 text-2xl font-semibold">{view.title}</h1></header><section className="border border-dashed border-[var(--border)] bg-[var(--card)] p-10 text-center"><Icon className="mx-auto size-5 text-[var(--muted-foreground)]" /><h2 className="mt-4 text-sm font-semibold">Live data is not available yet</h2><p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-[var(--muted-foreground)]">{view.description}</p></section></main>;
}
