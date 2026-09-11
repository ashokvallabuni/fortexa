import { FlaskConical, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/fx/Card';
import { Badge } from '@/components/fx/Badge';
import { DEMO_EVALUATION_METRICS } from '@/data/mockData';

const METRICS = [
  { key: 'precision', label: 'Precision' },
  { key: 'recall', label: 'Recall' },
  { key: 'f1', label: 'F1 Score' },
  { key: 'falsePositiveRate', label: 'False Positive Rate' },
  { key: 'auroc', label: 'AUROC' },
  { key: 'auprc', label: 'AUPRC' },
  { key: 'brierScore', label: 'Brier Score' },
  { key: 'earlyWarningLeadTime', label: 'Early Warning (min)' },
  { key: 'calibration', label: 'Calibration' },
];

export function EvaluationPage() {
  return (
    <div className="p-4 space-y-4 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-base font-semibold text-[var(--foreground)]">Model Evaluation</h1>
        <p className="text-xs text-[var(--muted-foreground)]">
          Comparative performance — real metrics require backend evaluation on labeled datasets
        </p>
      </div>

      <Card className="flex items-start gap-3">
        <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          <p className="text-[var(--foreground)] font-medium mb-1">Metrics not yet available</p>
          Evaluation metrics require running the models against labeled benchmark datasets with
          known ground truth. Results remain unavailable until a validated source has been processed
          and an evaluation run has completed.
        </div>
      </Card>

      {/* Comparison table */}
      <Card>
        <CardHeader>
          <CardTitle>Model Comparison</CardTitle>
          <Badge variant="outline">PENDING BACKEND</Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-3 text-[var(--muted-foreground)] font-medium uppercase tracking-wider text-[10px] w-40">
                  Metric
                </th>
                {DEMO_EVALUATION_METRICS.map((m) => (
                  <th
                    key={m.modelName}
                    className="text-center py-2 px-3 text-[var(--muted-foreground)] font-medium uppercase tracking-wider text-[10px]"
                  >
                    {m.modelName === 'FORTEXA' ? (
                      <span className="text-blue-400">{m.modelName}</span>
                    ) : (
                      m.modelName
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((metric) => (
                <tr
                  key={metric.key}
                  className="border-b border-[var(--border)] hover:bg-[var(--secondary)]"
                >
                  <td className="py-2 px-3 text-[var(--foreground)]">{metric.label}</td>
                  {DEMO_EVALUATION_METRICS.map((m) => (
                    <td
                      key={m.modelName}
                      className="py-2 px-3 text-center font-mono text-[var(--muted-foreground)]"
                    >
                      Not available
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Placeholder charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['ROC Curve', 'Precision-Recall Curve', 'Calibration Plot', 'Early Warning Lead Time'].map(
          (chart) => (
            <Card key={chart} className="text-center">
              <CardHeader>
                <CardTitle>{chart}</CardTitle>
              </CardHeader>
              <div className="h-40 flex flex-col items-center justify-center gap-2 border border-dashed border-[var(--border)] rounded">
                <FlaskConical className="size-6 text-[var(--muted-foreground)]" />
                <p className="text-xs text-[var(--muted-foreground)]">
                  Awaiting backend evaluation data
                </p>
                <Badge variant="outline">NOT AVAILABLE</Badge>
              </div>
            </Card>
          ),
        )}
      </div>

      {/* What will be measured */}
      <Card>
        <CardHeader>
          <CardTitle>Planned Evaluation Protocol</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
              Datasets
            </p>
            <ul className="space-y-1 text-[var(--muted-foreground)]">
              <li className="flex gap-2">
                <span>·</span>Validated labeled network capture dataset
              </li>
              <li className="flex gap-2">
                <span>·</span>CICIDS2017 (external benchmark)
              </li>
              <li className="flex gap-2">
                <span>·</span>NSL-KDD (intrusion detection baseline)
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
              Evaluation Methodology
            </p>
            <ul className="space-y-1 text-[var(--muted-foreground)]">
              <li className="flex gap-2">
                <span>·</span>Time-series cross-validation (no data leakage)
              </li>
              <li className="flex gap-2">
                <span>·</span>Calibrated probability outputs
              </li>
              <li className="flex gap-2">
                <span>·</span>Early warning lead time measured in minutes ahead of attack
                confirmation
              </li>
              <li className="flex gap-2">
                <span>·</span>False positive rate critical metric for operational deployments
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
