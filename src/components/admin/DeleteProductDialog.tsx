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
  const [confirmInput, setConfirmInput] = useState('');
  const isConfirmed = confirmInput.trim() === CONFIRM_TEXT;

  useEffect(() => {
    if (!open) setConfirmInput('');
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Top decorative bar */}
            <div className="h-1 w-full bg-gradient-to-r from-destructive/60 via-destructive to-destructive/60" />

            <div className="px-6 pt-8 pb-6 space-y-5">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>
              </div>

              {/* Text */}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  প্রোডাক্টটি কি মুছে ফেলতে চান?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">"{productName}"</span> মুছে ফেলা হবে।
                  <br />
                  <span className="text-destructive/80">এই কাজটি আর ফেরত নেওয়া যাবে না।</span>
                </p>
              </div>

              {/* Safety Check Input */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center">
                  নিশ্চিত করতে নিচে <span className="font-bold text-foreground bg-muted px-1.5 py-0.5 rounded-md">{CONFIRM_TEXT}</span> টাইপ করুন
                </p>
                <input
                  type="text"
                  value={confirmInput}
                  onChange={e => setConfirmInput(e.target.value)}
                  placeholder={CONFIRM_TEXT}
                  className="w-full bg-muted border-2 border-border rounded-xl px-4 py-3 text-sm text-center font-medium focus:outline-none focus:border-destructive/50 focus:ring-2 focus:ring-destructive/20 transition-all placeholder:text-muted-foreground/40"
                  autoFocus
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 px-5 py-3 rounded-xl text-sm font-medium border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                >
                  বাতিল করুন
                </button>
                <button
                  onClick={onConfirm}
                  disabled={!isConfirmed || isDeleting}
                  className="flex-1 px-5 py-3 rounded-xl text-sm font-semibold bg-destructive text-white hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      মুছে ফেলা হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      ডিলিট করুন
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
