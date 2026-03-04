import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const notifications = [
  'রাজশাহী থেকে সোহেল ভাই ১টি Kronos Sovereign কিনেছেন',
  'ঢাকা থেকে নাফিসা আপু ২টি ঘড়ি অর্ডার করেছেন',
  'চট্টগ্রাম থেকে তানভীর ভাই ১টি Kronos Elite কিনেছেন',
  'সিলেট থেকে রুমানা আপু ১টি ঘড়ি অর্ডার করেছেন',
  'খুলনা থেকে আরিফ ভাই ৩টি Kronos Classic কিনেছেন',
];

const FloatingNotification = () => {
  const [show, setShow] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % notifications.length);
      setShow(true);
      setTimeout(() => setShow(false), 4000);
    }, 30000);

    // Show first one after 5 seconds
    const initial = setTimeout(() => {
      setShow(true);
      setTimeout(() => setShow(false), 4000);
    }, 5000);

    return () => { clearInterval(interval); clearTimeout(initial); };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 z-50 max-w-xs"
        >
          <div className="bg-surface border border-border rounded-xl shadow-lg p-3 flex items-start gap-3">
            <span className="text-lg mt-0.5">🛒</span>
            <div>
              <p className="text-sm font-medium text-foreground leading-snug">{notifications[index]}</p>
              <p className="text-xs text-muted-foreground mt-1">কিছুক্ষণ আগে</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingNotification;
