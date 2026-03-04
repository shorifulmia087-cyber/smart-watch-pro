import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, CheckCircle, Clock } from 'lucide-react';

const DeliveryChecker = () => {
  const [city, setCity] = useState('');
  const [result, setResult] = useState<null | 'dhaka' | 'other'>(null);

  const handleCheck = () => {
    if (!city.trim()) return;
    const isDhaka = city.trim().toLowerCase().includes('dhaka') || city.trim().includes('ঢাকা');
    setResult(isDhaka ? 'dhaka' : 'other');
  };

  return (
    <section className="bg-ash py-20 px-4">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-surface rounded-2xl p-6 md:p-8 border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gold" />
            <h3 className="text-lg font-semibold">ডেলিভারি চেক করুন</h3>
          </div>
          <div className="flex gap-2">
            <input
              value={city}
              onChange={(e) => { setCity(e.target.value); setResult(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="আপনার শহরের নাম লিখুন..."
              className="flex-1 bg-ash border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 transition-shadow"
            />
            <button
              onClick={handleCheck}
              className="gradient-gold text-surface px-5 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
            >
              চেক
            </button>
          </div>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 flex items-center gap-2 text-sm font-medium p-3 rounded-xl ${
                result === 'dhaka'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {result === 'dhaka' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  আগামীকাল ডেলিভারি পাবেন! 🚀
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  ২-৩ কর্মদিবসে ডেলিভারি হবে।
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default DeliveryChecker;
