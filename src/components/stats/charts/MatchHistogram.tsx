import { motion } from "framer-motion";

interface MatchBracket {
  label: string;
  color: string;
  count: number;
}

interface MatchHistogramProps {
  brackets: MatchBracket[];
  maxBracket: number;
  total: number;
}

export const MatchHistogram = ({ brackets, maxBracket, total }: MatchHistogramProps) => (
  <motion.div
    className="rounded-2xl border border-border bg-card p-6 shadow-card"
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}
  >
    <h2 className="mb-1 font-bold text-foreground">🎯 Match % distribution</h2>
    <p className="mb-4 text-[11px] text-muted-foreground">
      How many users fall into each compatibility bracket
    </p>
    <div className="space-y-3">
      {brackets.map((b) => (
        <div key={b.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{b.label}</span>
            <span className="font-bold text-primary">
              {b.count} · {total ? Math.round((b.count / total) * 100) : 0}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className={`h-full rounded-full ${b.color}`}
              initial={{ width: 0 }}
              animate={{ width: `${maxBracket ? (b.count / maxBracket) * 100 : 0}%` }}
              transition={{ duration: 0.6, delay: 0.35 }}
            />
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);
