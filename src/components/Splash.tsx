import { motion } from 'framer-motion';

export default function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
        className="text-3xl font-bold tracking-tight"
      >
        run<span className="text-primary">way</span>
      </motion.div>
    </div>
  );
}
