import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LoadingOverlay = ({ visible }: { visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-surface/80 backdrop-blur-sm flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-10 h-10 text-gold animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">লোড হচ্ছে...</p>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default LoadingOverlay;
