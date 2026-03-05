import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

interface DeleteProductDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName: string;
  isDeleting: boolean;
}

const CONFIRM_TEXT = 'মুছে ফেলুন';

const DeleteProductDialog = ({ open, onClose, onConfirm, productName, isDeleting }: DeleteProductDialogProps) => {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const canDelete = typed === CONFIRM_TEXT;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-sm bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="h-1 w-full bg-gradient-to-r from-destructive/60 via-destructive to-destructive/60" />
            <div className="px-6 pt-8 pb-6 space-y-5">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-foreground">প্রোডাক্টটি মুছে ফেলবেন?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">"{productName}"</span> মুছে ফেলা হবে।
                  <br />
                  <span className="text-destructive/80">এই কাজটি আর ফেরত নেওয়া যাবে না।</span>
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  নিশ্চিত করতে <span className="font-bold text-destructive">"{CONFIRM_TEXT}"</span> টাইপ করুন
                </label>
                <input
                  type="text"
                  value={typed}
                  onChange={e => setTyped(e.target.value)}
                  placeholder={CONFIRM_TEXT}
                  className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30 transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 px-5 py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  বাতিল
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting || !canDelete}
                  className="flex-1 px-5 py-3 rounded-xl text-sm font-semibold bg-destructive text-white hover:bg-destructive/90 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      মুছে ফেলা হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      ডিলিট
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DeleteProductDialog;
