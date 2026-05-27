import { motion } from "framer-motion";
import type { FunnelCounts } from "../types";

interface FunnelChartProps {
  funnel: FunnelCounts;
}

const STEP_COLORS = ["bg-blue-500", "bg-orange-500", "bg-green-500"];

export const FunnelChart = ({ funnel }: FunnelChartProps) => {
  const steps = [
    { label: "Quizzes started", value: funnel.started     },
    { label: "Result shown",    value: funnel.resultShown },
    { label: "Claimed",         value: funnel.claimed     },
  ];

  const finalRatio = funnel.started ? funnel.claimed / funnel.started : 0;
  const finalColor =
    finalRatio >= 0.5  ? "text-green-600" :
    finalRatio >= 0.25 ? "text-orange-500" :
                         "text-destructive";

  return (
    <motion.div
      className="rounded-2xl border border-border bg-card p-6 shadow-card"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
    >
      <h2 className="mb-4 font-bold text-foreground">🔽 Drop-off funnel</h2>
      {steps.map(({ label, value }, i) => {
        const pctOfTotal = steps[0].value ? Math.round((value / steps[0].value) * 100) : 0;
        const pctOfPrev  = i > 0 && steps[i - 1].value ? Math.round((value / steps[i - 1].value) * 100) : null;
        const dropoff    = i > 0 ? steps[i - 1].value - value : 0;
        return (
          <div key={label} className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{label}</span>
              <div className="flex items-center gap-2 text-right">
                <span className="font-semibold text-foreground">{value}</span>
                {pctOfPrev !== null && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    pctOfPrev >= 70 ? "bg-green-500/15 text-green-600"
                    : pctOfPrev >= 40 ? "bg-orange-500/15 text-orange-600"
                    : "bg-destructive/15 text-destructive"
                  }`}>
                    {pctOfPrev}% from prev. step
                  </span>
                )}
                {dropoff > 0 && (
                  <span className="text-muted-foreground">−{dropoff} dropped</span>
                )}
              </div>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className={`h-full rounded-full ${STEP_COLORS[i]}`}
                initial={{ width: 0 }}
                animate={{ width: `${pctOfTotal}%` }}
                transition={{ duration: 0.6, delay: 0.1 * i }}
              />
            </div>
            <p className="mt-0.5 text-right text-[10px] text-muted-foreground">
              {pctOfTotal}% of total started
            </p>
          </div>
        );
      })}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/50 px-4 py-2.5">
        <span className="text-xs text-muted-foreground">Final conversion (started → claim)</span>
        <span className={`text-sm font-bold ${finalColor}`}>
          {Math.round(finalRatio * 100)}%
        </span>
      </div>
    </motion.div>
  );
};
