import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toBengaliNum, formatBengaliPrice } from '@/lib/bengali';
import { useCreateOrder, useSettings, useFeaturedProduct } from '@/hooks/useSupabaseData';
import { useRateLimit } from '@/hooks/useRateLimit';
import { sanitizeForDisplay, isValidPhone, isBot } from '@/lib/security';
import { Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StickyOrderForm = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<'dhaka' | 'outside'>('dhaka');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  // Honeypot
  const [honeypot, setHoneypot] = useState('');
  const { data: settings } = useSettings();
  const { data: product } = useFeaturedProduct();
  const createOrder = useCreateOrder();
  const { toast } = useToast();
  const { checkLimit } = useRateLimit({ maxAttempts: 3, windowMs: 60_000 });

  const deliveryCharge = location === 'dhaka'
    ? (settings?.delivery_charge_inside ?? 70)
    : (settings?.delivery_charge_outside ?? 150);
  const price = product?.price ?? 0;
  const total = price + deliveryCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check
    if (isBot(honeypot)) {
      setSuccess(true);
      return;
    }

    // Rate limiting
    if (!checkLimit()) {
      toast({ title: 'অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন', variant: 'destructive' });
      return;
    }

    const cleanName = sanitizeForDisplay(name);
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const cleanAddress = sanitizeForDisplay(address);

    if (!cleanName || !cleanPhone || !cleanAddress || !product) return;
    if (!isValidPhone(cleanPhone)) {
      toast({ title: 'সঠিক মোবাইল নম্বর দিন', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await createOrder.mutateAsync({
        customer_name: cleanName,
        phone: cleanPhone,
        address: cleanAddress,
        watch_model: product.name,
        quantity: 1,
        payment_method: 'cod',
        delivery_location: location,
        delivery_charge: deliveryCharge,
        total_price: total,
      });
      setSuccess(true);
      setName(''); setPhone(''); setAddress(''); setHoneypot('');
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      toast({ title: 'ত্রুটি হয়েছে', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <section className="py-10 px-4 bg-gradient-to-b from-surface to-ash">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-foreground">⚡ দ্রুত অর্ডার করুন</h2>
          <p className="text-sm text-muted-foreground mt-1">শুধু নাম, ফোন ও ঠিকানা দিন — ক্যাশ অন ডেলিভারি</p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center p-8 glass-card rounded-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-foreground">অর্ডার সফল! 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">শীঘ্রই আমরা যোগাযোগ করব।</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="glass-card rounded-2xl p-5 md:p-6 space-y-4"
            >
              <div className="flex items-center justify-between p-3 bg-accent/5 rounded-xl border border-accent/20">
                <div>
                  <p className="text-sm font-semibold text-foreground">{product.name}</p>
                  <p className="text-[11px] text-muted-foreground">ক্যাশ অন ডেলিভারি</p>
                </div>
                <p className="text-lg font-bold text-accent font-inter">৳{formatBengaliPrice(total)}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={name} onChange={e => setName(e.target.value)} required
                  placeholder="আপনার নাম *" maxLength={100}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <input
                  value={phone} onChange={e => setPhone(e.target.value)} required
                  placeholder="মোবাইল নম্বর *" maxLength={15}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
              <textarea
                value={address} onChange={e => setAddress(e.target.value)} required
                placeholder="সম্পূর্ণ ঠিকানা *" rows={2} maxLength={500}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
              />
              
              {/* Honeypot - invisible to real users */}
              <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true" tabIndex={-1}>
                <input
                  type="text"
                  name="fax_number"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setLocation('dhaka')}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${location === 'dhaka' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground'}`}>
                  ঢাকা (৳{toBengaliNum(settings?.delivery_charge_inside ?? 70)})
                </button>
                <button type="button" onClick={() => setLocation('outside')}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${location === 'outside' ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground'}`}>
                  বাইরে (৳{toBengaliNum(settings?.delivery_charge_outside ?? 150)})
                </button>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full gradient-gold text-surface font-semibold py-3.5 rounded-xl text-base hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> প্রসেসিং...</> : `অর্ডার নিশ্চিত করুন — ৳${formatBengaliPrice(total)}`}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default StickyOrderForm;
