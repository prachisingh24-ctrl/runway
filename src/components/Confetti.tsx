import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

/** Full-screen confetti burst + message. */
export default function Confetti({ show, message, onDone }: { show: boolean; message: string; onDone: () => void }) {
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [show, onDone]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {Array.from({ length: 60 }).map((_, i) => (
            <motion.span key={i} className="absolute w-2.5 h-3.5 rounded-sm" style={{ background: COLORS[i % 4], top: '50%', left: '50%' }}
              initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
              animate={{ x: (Math.random() - 0.5) * 900, y: (Math.random() - 0.8) * 700, rotate: Math.random() * 720, opacity: 0 }}
              transition={{ duration: 1.8 + Math.random(), ease: 'easeOut' }} />
          ))}
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-primary rounded-3xl px-8 py-6 text-center shadow-2xl">
            <p className="text-5xl">🏆</p><p className="mt-2 text-xl font-bold">{message}</p><p className="text-sm text-muted-foreground">Goal crusher badge unlocked</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
