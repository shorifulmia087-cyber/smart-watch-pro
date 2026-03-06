import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Loader2, Check, Copy, AlertCircle } from 'lucide-react';
import { toBengaliNum, formatBengaliPrice } from '@/lib/bengali';
import { useCreateOrder } from '@/hooks/useSupabaseData';
import { useRateLimit } from '@/hooks/useRateLimit';
import { sanitizeForDisplay, isValidPhone, isBot } from '@/lib/security';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  unitPrice: number;
  watchName: string;
  deliveryChargeInside?: number;
  deliveryChargeOutside?: number;
  onlinePaymentEnabled?: boolean;
  bkashNumber?: string;
  nagadNumber?: string;
  rocketNumber?: string;
  availableColors?: string[];
}

interface FormErrors {
  name?: string;
  phone?: string;
  address?: string;
  color?: string;
  txnId?: string;
}

const OrderModal = ({ isOpen, onClose, unitPrice, watchName, deliveryChargeInside = 70, deliveryChargeOutside = 150, onlinePaymentEnabled = true, bkashNumber = '', nagadNumber = '', rocketNumber = '', availableColors = [] }: OrderModalProps) => {
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'cod' | 'online'>('cod');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [txnId, setTxnId] = useState('');
  const [payMethod, setPayMethod] = useState('bkash');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [location, setLocation] = useState<'dhaka' | 'outside'>('dhaka');
  const [selectedColor, setSelectedColor] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [honeypot2, setHoneypot2] = useState('');
  const createOrder = useCreateOrder();
  const { toast } = useToast();
  const { checkLimit } = useRateLimit({ maxAttempts: 10, windowMs: 60_000 });

  useEffect(() => {
    if (!isOpen) {
      setQty(1); setTab('cod'); setName(''); setEmail(''); setPhone(''); setAddress(''); setTxnId(''); setLoading(false); setSuccess(false); setLocation('dhaka'); setHoneypot(''); setHoneypot2(''); setSelectedColor(''); setErrors({}); setTouched(false);
    }
  }, [isOpen]);

  const deliveryCharge = location === 'dhaka' ? deliveryChargeInside : deliveryChargeOutside;
  const subtotal = qty * unitPrice;
  const grandTotal = subtotal + deliveryCharge;

  const validate = useCallback((): FormErrors => {
    const errs: FormErrors = {};
    const cleanName = name.trim();
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const cleanAddress = address.trim();

    if (!cleanName) errs.name = 'নাম লিখুন';
    else if (cleanName.length < 3) errs.name = 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে';

    if (!cleanPhone) errs.phone = 'মোবাইল নম্বর দিন';
    else if (!isValidPhone(cleanPhone)) errs.phone = 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন';

    if (!cleanAddress) errs.address = 'ঠিকানা লিখুন';
    else if (cleanAddress.length < 10) errs.address = 'সম্পূর্ণ ঠিকানা দিন (কমপক্ষে ১০ অক্ষর)';

    if (availableColors.length > 0 && !selectedColor) errs.color = 'একটি কালার সিলেক্ট করুন';

    if (tab === 'online') {
      const requiredLen = payMethod === 'bkash' ? 10 : payMethod === 'nagad' ? 8 : 10;
      if (!txnId) errs.txnId = 'ট্রানজেকশন আইডি দিন';
      else if (txnId.length !== requiredLen) {
        const label = payMethod === 'bkash' ? '১০' : payMethod === 'nagad' ? '৮' : '১০';
        errs.txnId = `ট্রানজেকশন আইডি ঠিক ${label} অক্ষরের হতে হবে`;
      }
    }

    return errs;
  }, [name, phone, address, selectedColor, availableColors, tab, payMethod, txnId]);

  useEffect(() => {
    if (touched) {
      setErrors(validate());
    }
  }, [touched, validate]);

  const handleSubmit = async () => {
    if (isBot(honeypot) || isBot(honeypot2)) {
      setSuccess(true);
      return;
    }

    setTouched(true);
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast({ title: 'তথ্য পূরণ করুন', description: 'সকল প্রয়োজনীয় ফিল্ড সঠিকভাবে পূরণ করুন।', variant: 'destructive' });
      return;
    }

    if (!checkLimit()) {
      toast({ title: 'অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন', description: 'অনেক বেশি রিকোয়েস্ট পাঠানো হয়েছে।', variant: 'destructive' });
      return;
    }

    const cleanName = sanitizeForDisplay(name);
    const cleanPhone = phone.replace(/[\s-]/g, '');
    const cleanAddress = sanitizeForDisplay(address);

    setLoading(true);

    const orderData = {
      customer_name: cleanName,
      customer_email: email ? sanitizeForDisplay(email) : null,
      phone: cleanPhone,
      address: cleanAddress,
      watch_model: watchName,
      quantity: qty,
      payment_method: tab === 'cod' ? 'cod' : payMethod,
      trx_id: tab === 'online' ? txnId.replace(/[^a-zA-Z0-9]/g, '') : null,
      delivery_location: location,
      delivery_charge: deliveryCharge,
      total_price: grandTotal,
      selected_color: selectedColor || null,
    } as any;

    try {
      await createOrder.mutateAsync(orderData);
      supabase.functions.invoke('send-order-email', { body: orderData }).catch(console.error);
      setLoading(false);
      setSuccess(true);
    } catch (err: any) {
      setLoading(false);
      console.error('Order submission failed:', err);
      toast({ 
        title: 'অর্ডার সমস্যা', 
        description: err?.message || 'অনুগ্রহ করে সব তথ্য সঠিকভাবে পূরণ করে আবার চেষ্টা করুন।', 
        variant: 'destructive' 
      });
    }
  };

  const isFormValid = Object.keys(validate()).length === 0;

  if (!isOpen) return null;

  if (success) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[100] bg-surface flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', damping: 15 }}
              className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6"
            >
              <Check className="w-10 h-10 text-success" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">ধন্যবাদ! 🎉</h2>
            <p className="text-muted-foreground mb-1">আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে।</p>
            <p className="text-muted-foreground text-sm mb-8">শীঘ্রই আমাদের টিম যোগাযোগ করবে।</p>
            <button
              onClick={onClose}
              className="gradient-gold text-surface font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
              style={{ boxShadow: '0 4px 16px -4px hsl(var(--gold) / 0.4)' }}
            >
              ঠিক আছে
            </button>
          </motion.div>
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: '50vw', y: '50vh', scale: 0 }}
                animate={{
                  x: `${Math.random() * 100}vw`,
                  y: `${Math.random() * 100}vh`,
                  scale: [0, 1, 0],
                  rotate: Math.random() * 720,
                }}
                transition={{
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#b8963e', '#e5c76b', '#0a0a0a', '#22c55e', '#ef4444'][i % 5],
                }}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error || !touched) return null;
    return (
      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-destructive mt-1 flex items-center gap-1">
        <AlertCircle className="w-3 h-3 flex-shrink-0" />
        {error}
      </motion.p>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-ink/50 backdrop-blur-md flex items-end md:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface w-full md:max-w-md md:rounded-xl rounded-t-xl max-h-[90vh] overflow-y-auto relative border border-border/40"
          style={{
            boxShadow: '0 -8px 40px -8px hsl(var(--ink) / 0.15), 0 0 0 1px hsl(var(--border) / 0.4)',
          }}
        >
          {/* Header with gold accent line */}
          <div className="relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] gradient-gold" />
            <div className="flex items-center justify-between p-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">অর্ডার করুন</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{watchName}</p>
              </div>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-muted/60 backdrop-blur-sm flex items-center justify-center hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          </div>

          <div className="p-5 pt-0 space-y-5">
            {/* Price & Quantity Card */}
            <div
              className="rounded-xl p-4 space-y-3 border border-border/40"
              style={{
                backgroundImage: `linear-gradient(hsl(var(--border) / 0.12) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.12) 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
                backgroundColor: 'hsl(var(--ash))',
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">পণ্যের মূল্য</p>
                  <p className="text-2xl font-bold text-gold mt-0.5">৳{formatBengaliPrice(subtotal)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-lg border border-border/60 bg-surface flex items-center justify-center hover:border-gold/40 transition-colors">
                    <Minus className="w-4 h-4 text-foreground" />
                  </button>
                  <span className="text-lg font-bold w-8 text-center tabular-nums text-foreground">{toBengaliNum(qty)}</span>
                  <button onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-lg border border-border/60 bg-surface flex items-center justify-center hover:border-gold/40 transition-colors">
                    <Plus className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              </div>

              <div className="border-t border-border/60 pt-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">ডেলিভারি এলাকা</p>
                <div className="flex gap-2">
                  <button onClick={() => setLocation('dhaka')} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${location === 'dhaka' ? 'border-gold bg-gold/10 text-gold shadow-sm' : 'border-border/60 bg-surface text-muted-foreground hover:border-border'}`}>
                    ঢাকার ভেতরে
                  </button>
                  <button onClick={() => setLocation('outside')} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${location === 'outside' ? 'border-gold bg-gold/10 text-gold shadow-sm' : 'border-border/60 bg-surface text-muted-foreground hover:border-border'}`}>
                    ঢাকার বাইরে
                  </button>
                </div>
                {location === 'outside' && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-xs text-destructive mt-2 leading-relaxed bg-destructive/5 p-2 rounded-lg border border-destructive/10">
                    ⚠️ ঢাকার বাইরে ডেলিভারির জন্য ২০০ টাকা অগ্রিম প্রদান করতে হবে।
                  </motion.p>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-border/60 pt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>ডেলিভারি চার্জ</span>
                  <span>৳{formatBengaliPrice(deliveryCharge)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">সর্বমোট</span>
                  <span className="text-2xl font-bold text-gold">৳{formatBengaliPrice(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <div>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="আপনার নাম *" className={`w-full bg-transparent border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all ${touched && errors.name ? 'border-destructive/60 bg-destructive/5' : 'border-border/60'}`} maxLength={100} />
                <ErrorMessage error={errors.name} />
              </div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ইমেইল (ঐচ্ছিক)" className="w-full bg-transparent border border-border/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all" maxLength={255} />
              <div>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="মোবাইল নম্বর *" className={`w-full bg-transparent border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all ${touched && errors.phone ? 'border-destructive/60 bg-destructive/5' : 'border-border/60'}`} maxLength={15} />
                <ErrorMessage error={errors.phone} />
              </div>
              <div>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="সম্পূর্ণ ঠিকানা *" rows={2} className={`w-full bg-transparent border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all resize-none ${touched && errors.address ? 'border-destructive/60 bg-destructive/5' : 'border-border/60'}`} maxLength={500} />
                <ErrorMessage error={errors.address} />
              </div>
              
              {/* Color Selection */}
              {availableColors.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">কালার সিলেক্ট করুন *</p>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-all ${
                          selectedColor === color
                            ? 'border-gold bg-gold/10 text-gold shadow-sm ring-1 ring-gold/30'
                            : 'border-border/60 bg-surface text-muted-foreground hover:border-border'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                  <ErrorMessage error={errors.color} />
                </div>
              )}
              {/* Honeypot fields */}
              <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true" tabIndex={-1}>
                <input type="text" name="website_url" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
                <input type="text" name="company_name" value={honeypot2} onChange={(e) => setHoneypot2(e.target.value)} tabIndex={-1} autoComplete="off" />
              </div>
            </div>

            {/* Payment Tabs */}
            <div>
              <div className="flex rounded-xl bg-muted/50 p-1 gap-1 border border-border/40">
                <button onClick={() => setTab('cod')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'cod' ? 'bg-surface shadow-sm text-foreground border border-border/30' : 'text-muted-foreground hover:text-foreground'}`}>
                  ক্যাশ অন ডেলিভারি
                </button>
                {onlinePaymentEnabled && (
                  <button onClick={() => setTab('online')} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'online' ? 'bg-surface shadow-sm text-foreground border border-border/30' : 'text-muted-foreground hover:text-foreground'}`}>
                    অনলাইন পেমেন্ট
                  </button>
                )}
              </div>
              {tab === 'cod' && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 rounded-lg bg-success/5 border border-success/10">
                  <p className="text-sm text-foreground font-medium">✅ পণ্য হাতে পেয়ে টাকা দিন</p>
                  <p className="text-xs text-muted-foreground mt-0.5">কোনো অগ্রিম পেমেন্ট প্রয়োজন নেই।</p>
                </motion.div>
              )}
              {tab === 'online' && onlinePaymentEnabled && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    {['bkash', 'nagad', 'rocket'].map((m) => (
                      <button key={m} onClick={() => setPayMethod(m)} className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${payMethod === m ? 'border-gold bg-gold/10 text-gold shadow-sm' : 'border-border/60 bg-surface text-muted-foreground hover:border-border'}`}>
                        {m === 'bkash' ? 'বিকাশ' : m === 'nagad' ? 'নগদ' : 'রকেট'}
                      </button>
                    ))}
                  </div>

                  {/* Payment number display with copy */}
                  {(() => {
                    const numberMap: Record<string, string> = { bkash: bkashNumber, nagad: nagadNumber, rocket: rocketNumber };
                    const labelMap: Record<string, string> = { bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট' };
                    const currentNumber = numberMap[payMethod] || '';
                    if (!currentNumber) return null;
                    return (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gold/5 border border-gold/15">
                        <div>
                          <p className="text-xs text-muted-foreground">{labelMap[payMethod]} নম্বর</p>
                          <p className="text-sm font-bold text-foreground font-mono tracking-wider mt-0.5">{currentNumber}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(currentNumber);
                            toast({ title: 'কপি হয়েছে ✓', description: `${labelMap[payMethod]} নম্বর কপি করা হয়েছে।` });
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-xs font-medium hover:bg-gold/20 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          কপি
                        </button>
                      </div>
                    );
                  })()}

                  <div>
                    {(() => {
                      const requiredLen = payMethod === 'bkash' ? 10 : payMethod === 'nagad' ? 8 : 10;
                      const label = payMethod === 'bkash' ? '১০' : payMethod === 'nagad' ? '৮' : '১০';
                      return (
                        <>
                          <input
                            value={txnId}
                            onChange={(e) => setTxnId(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                            placeholder={`ট্রানজেকশন আইডি (${label} অক্ষর) *`}
                            maxLength={requiredLen}
                            className={`w-full bg-transparent border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all font-mono ${touched && errors.txnId ? 'border-destructive/60 bg-destructive/5' : 'border-border/60'}`}
                          />
                          <ErrorMessage error={errors.txnId} />
                        </>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`w-full gradient-gold text-surface font-semibold py-3.5 rounded-xl text-base disabled:opacity-70 flex items-center justify-center gap-2 ${touched && !isFormValid ? 'opacity-80' : ''}`}
              style={{
                boxShadow: '0 4px 16px -4px hsl(var(--gold) / 0.35)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  প্রসেসিং...
                </>
              ) : (
                `অর্ডার নিশ্চিত করুন — ৳${formatBengaliPrice(grandTotal)}`
              )}
            </motion.button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 pt-1 pb-2">
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">🔒 নিরাপদ অর্ডার</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">🚚 দ্রুত ডেলিভারি</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">✅ গুণগত মান</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderModal;
