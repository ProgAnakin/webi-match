import { motion } from "framer-motion";

interface SuccessScreenProps {
  email: string;
  productName: string;
  onRestart: () => void;
}

const SuccessScreen = ({ email, productName, onRestart }: SuccessScreenProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <motion.div
        className="flex w-full max-w-md flex-col items-center gap-8 text-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <motion.div
          className="text-8xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          📧
        </motion.div>

        <div>
          <h2 className="text-3xl font-bold text-foreground">Email Inviata!</h2>
          <p className="mt-3 text-muted-foreground">
            La guida esclusiva del <span className="font-semibold text-gradient">{productName}</span> è stata inviata a:
          </p>
          <p className="mt-2 rounded-xl bg-card px-4 py-2 font-mono text-sm text-foreground">
            {email}
          </p>
        </div>

        <div className="w-full space-y-3 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm font-semibold text-foreground">📦 Cosa riceverai:</p>
          <div className="space-y-2 text-left text-sm text-muted-foreground">
            <p>🎬 Video esplicativo di 30 secondi</p>
            <p>📖 Manuale completo del prodotto</p>
            <p>❓ 3 domande più frequenti (FAQ)</p>
            <p>🏷️ Sconto esclusivo Webidoo!</p>
          </div>
        </div>

        <motion.button
          onClick={onRestart}
          className="w-full rounded-2xl border-2 border-border px-8 py-4 text-lg font-semibold text-foreground transition-colors hover:bg-card active:scale-95"
          whileTap={{ scale: 0.97 }}
        >
          🔄 Gioca di Nuovo
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SuccessScreen;
