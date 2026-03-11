import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Loader2, Check, Copy, AlertCircle, ShieldAlert } from 'lucide-react';
import { toBengaliNum, formatBengaliPrice } from '@/lib/bengali';
import { useSecureOrder } from '@/hooks/useSecureOrder';
import { useRateLimit } from '@/hooks/useRateLimit';
import { sanitizeForDisplay, isValidPhone, isBot } from '@/lib/security';
import { useToast } from '@/hooks/use-toast';
import { useTurnstile } from '@/hooks/useTurnstile';
import { useFraudCheck, type FraudResult } from '@/hooks/useFraudCheck';
import UpazilaCombobox from '@/components/UpazilaCombobox';
import type { Upazila } from '@/data/bangladeshLocations';

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
  onOrderSuccess?: () => void;
  onOrderOpen?: () => void;
}

interface FormErrors {
  name?: string;
  phone?: string;
  address?: string;
  color?: string;
  txnId?: string;
  upazila?: string;
}

const OrderModal = ({ isOpen, onClose, unitPrice, watchName, deliveryChargeInside = 70, deliveryChargeOutside = 150, onlinePaymentEnabled = true, bkashNumber = '', nagadNumber = '', rocketNumber = '', availableColors = [], onOrderSuccess, onOrderOpen }: OrderModalProps) => {
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<'cod' | 'online'>('cod');
  const [paymentType, setPaymentType] = useState<'full_payment' | 'delivery_charge_only'>('delivery_charge_only');
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
  const [selectedUpazila, setSelectedUpazila] = useState<Upazila | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Auto-detect delivery zone from division
  useEffect(() => {
    if (selectedUpazila) {
      setLocation(selectedUpazila.district === 'ঢাকা' ? 'dhaka' : 'outside');
    }
  }, [selectedUpazila]);
  const [touched, setTouched] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [honeypot2, setHoneypot2] = useState('');
  const createOrder = useSecureOrder();
  const { toast } = useToast();
  const { checkLimit } = useRateLimit({ maxAttempts: 10, windowMs: 60_000 });
  const { containerRef: turnstileRef, token: turnstileToken, reset: resetTurnstile, isEnabled: turnstileEnabled } = useTurnstile();
  const { checkPhone, loading: fraudLoading, result: fraudResult, reset: resetFraud } = useFraudCheck();
  const fraudCheckedRef = useRef('');

  useEffect(() => {
    if (isOpen && onOrderOpen) onOrderOpen();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setQty(1); setTab('cod'); setPaymentType('delivery_charge_only'); setName(''); setEmail(''); setPhone(''); setAddress(''); setTxnId(''); setLoading(false); setSuccess(false); setLocation('dhaka'); setHoneypot(''); setHoneypot2(''); setSelectedColor(''); setErrors({}); setTouched(false); setSelectedUpazila(null);
      setCouponCode(''); setCouponDiscount(0); setCouponApplied(false); setCouponError('');
      resetFraud(); fraudCheckedRef.current = '';
    }
  }, [isOpen]);

  const deliveryCharge = location === 'dhaka' ? deliveryChargeInside : deliveryChargeOutside;
  const subtotal = qty * unitPrice;
  const grandTotal = subtotal + deliveryCharge - couponDiscount;

  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data, error } = await supabase
        .from('coupons' as any)
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();
      if (error || !data) {
        setCouponError('কুপন কোড সঠিক নয়');
        setCouponDiscount(0);
        setCouponApplied(false);
        return;
      }
      const c = data as any;
      // Check expiry
      if (c.expires_at && new Date(c.expires_at) < new Date()) {
        setCouponError('কুপনের মেয়াদ শেষ');
        return;
      }
      // Check max uses
      if (c.max_uses !== null && c.used_count >= c.max_uses) {
        setCouponError('কুপন ব্যবহারের সীমা শেষ');
        return;
      }
      // Check min order
      const rawTotal = subtotal + deliveryCharge;
      if (rawTotal < c.min_order_amount) {
        setCouponError(`সর্বনিম্ন অর্ডার ৳${c.min_order_amount}`);
        return;
      }
      // Calculate discount
      let discount = 0;
      if (c.discount_type === 'percentage') {
        discount = Math.round(subtotal * c.discount_value / 100);
      } else {
        discount = c.discount_value;
      }
      // Don't let discount exceed subtotal
      discount = Math.min(discount, subtotal);
      setCouponDiscount(discount);
      setCouponApplied(true);
    } catch {
      setCouponError('সমস্যা হয়েছে');
    } finally {
      setCouponLoading(false);
    }
  }, [couponCode, subtotal, deliveryCharge]);

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

    if (!selectedUpazila) errs.upazila = 'উপজেলা নির্বাচন করুন';

    if (tab === 'online') {
      const requiredLen = payMethod === 'bkash' ? 10 : payMethod === 'nagad' ? 8 : 10;
      if (!txnId) errs.txnId = 'ট্রানজেকশন আইডি দিন';
      else if (txnId.length !== requiredLen) {
        const label = payMethod === 'bkash' ? '১০' : payMethod === 'nagad' ? '৮' : '১০';
        errs.txnId = `ট্রানজেকশন আইডি ঠিক ${label} অক্ষরের হতে হবে`;
      }
    }

    return errs;
  }, [name, phone, address, selectedColor, availableColors, tab, payMethod, txnId, selectedUpazila]);

  useEffect(() => {
    if (touched) {
      setErrors(validate());
    }
  }, [touched, validate]);

  // Fraud check on phone blur
  const handlePhoneBlur = useCallback(async () => {
    const clean = phone.replace(/[\s-]/g, '');
    if (isValidPhone(clean) && fraudCheckedRef.current !== clean) {
      fraudCheckedRef.current = clean;
      await checkPhone(clean);
    }
  }, [phone, checkPhone]);

  // If fraud blocks COD, force online tab
  useEffect(() => {
    if (fraudResult && fraudResult.flag === 'low_success' && tab === 'cod') {
      setTab('online');
    }
  }, [fraudResult, tab]);

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

    if (turnstileEnabled && !turnstileToken) {
      toast({ title: 'ভেরিফিকেশন প্রয়োজন', description: 'অনুগ্রহ করে "আমি রোবট নই" চেকবক্স ক্লিক করুন।', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const advanceAmount = tab === 'online'
        ? (paymentType === 'full_payment' ? grandTotal : deliveryCharge)
        : 0;

      await createOrder.mutateAsync({
        customer_name: cleanName,
        customer_email: email ? sanitizeForDisplay(email) : null,
        phone: cleanPhone,
        address: cleanAddress,
        watch_model: watchName,
        quantity: qty,
        payment_method: tab === 'cod' ? 'cod' : payMethod,
        trx_id: tab === 'online' ? txnId.replace(/[^a-zA-Z0-9]/g, '') : null,
        delivery_location: location,
        selected_color: selectedColor || null,
        turnstile_token: turnstileToken,
        payment_type: tab === 'cod' ? 'cod' : paymentType,
        advance_amount: advanceAmount,
        upazila: selectedUpazila?.name ?? null,
        district: selectedUpazila?.district ?? null,
        division: selectedUpazila?.division ?? null,
        fraud_total_parcels: fraudResult?.total_parcels ?? undefined,
        fraud_total_delivered: fraudResult?.total_delivered ?? undefined,
        fraud_total_cancel: fraudResult?.total_cancel ?? undefined,
        fraud_success_rate: fraudResult?.success_rate ?? undefined,
        fraud_flag: fraudResult?.flag ?? undefined,
        fraud_error_message: fraudResult?.error_message ?? undefined,
      });
      setLoading(false);
      setSuccess(true);
      resetTurnstile();
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
                  <button
                    onClick={() => setLocation('dhaka')}
                    disabled={!!selectedUpazila}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${location === 'dhaka' ? 'border-gold bg-gold/10 text-gold shadow-sm' : 'border-border/60 bg-surface text-muted-foreground hover:border-border'} ${selectedUpazila ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    ঢাকার ভেতরে
                  </button>
                  <button
                    onClick={() => setLocation('outside')}
                    disabled={!!selectedUpazila}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${location === 'outside' ? 'border-gold bg-gold/10 text-gold shadow-sm' : 'border-border/60 bg-surface text-muted-foreground hover:border-border'} ${selectedUpazila ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    ঢাকার বাইরে
                  </button>
                </div>
                {selectedUpazila && (
                  <p className="text-xs text-muted-foreground mt-2">
                    উপজেলা অনুযায়ী ডেলিভারি এলাকা অটোমেটিক নির্ধারিত। পরিবর্তন করতে উপজেলা বদলান।
                  </p>
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
                <div className="relative">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={handlePhoneBlur} placeholder="মোবাইল নম্বর *" className={`w-full bg-transparent border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all ${touched && errors.phone ? 'border-destructive/60 bg-destructive/5' : 'border-border/60'}`} maxLength={15} />
                  {fraudLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    </div>
                  )}
                </div>
                <ErrorMessage error={errors.phone} />
                {fraudResult?.flag === 'low_success' && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-3 rounded-lg bg-destructive/5 border border-destructive/15">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-destructive leading-relaxed">{fraudResult.message}</p>
                    </div>
                  </motion.div>
                )}
                {fraudResult?.flag === 'new_customer' && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-warning mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> নতুন কাস্টমার
                  </motion.p>
                )}
              </div>
              <div>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="বিস্তারিত ঠিকানা (বাড়ি, রোড, এলাকা) *" rows={2} className={`w-full bg-transparent border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold/20 focus:border-gold/40 transition-all resize-none ${touched && errors.address ? 'border-destructive/60 bg-destructive/5' : 'border-border/60'}`} maxLength={500} />
                <ErrorMessage error={errors.address} />
              </div>

              {/* Upazila Selector */}
              <div>
                <UpazilaCombobox value={selectedUpazila} onChange={setSelectedUpazila} hasError={touched && !!errors.upazila} />
                <ErrorMessage error={errors.upazila} />
                {selectedUpazila && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-gold/5 border border-gold/10 text-gold">{selectedUpazila.district}</span>
                    <span className="px-2 py-0.5 rounded bg-muted/30 border border-border/30">{selectedUpazila.division} বিভাগ</span>
                  </motion.div>
                )}
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
                <button onClick={() => { if (fraudResult?.flag !== 'low_success') setTab('cod'); }} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === 'cod' ? 'bg-surface shadow-sm text-foreground border border-border/30' : 'text-muted-foreground hover:text-foreground'} ${fraudResult?.flag === 'low_success' ? 'opacity-40 cursor-not-allowed' : ''}`}>
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
                  {/* Payment Type Choice */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">কতটুকু পেমেন্ট করবেন?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaymentType('full_payment')}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          paymentType === 'full_payment'
                            ? 'border-success bg-success/10 text-success shadow-sm'
                            : 'border-border/60 bg-surface text-muted-foreground hover:border-border'
                        }`}
                      >
                        সম্পূর্ণ পেমেন্ট
                        <span className="block text-[10px] mt-0.5 opacity-70">৳{formatBengaliPrice(grandTotal)}</span>
                      </button>
                      <button
                        onClick={() => setPaymentType('delivery_charge_only')}
                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          paymentType === 'delivery_charge_only'
                            ? 'border-warning bg-warning/10 text-warning shadow-sm'
                            : 'border-border/60 bg-surface text-muted-foreground hover:border-border'
                        }`}
                      >
                        শুধু ডেলিভারি চার্জ
                        <span className="block text-[10px] mt-0.5 opacity-70">৳{formatBengaliPrice(deliveryCharge)}</span>
                      </button>
                    </div>
                    {paymentType === 'delivery_charge_only' && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-warning mt-2 bg-warning/5 p-2 rounded-lg border border-warning/10">
                        💰 বাকি ৳{formatBengaliPrice(grandTotal - deliveryCharge)} ক্যাশ অন ডেলিভারিতে পরিশোধ করতে হবে
                      </motion.p>
                    )}
                    {paymentType === 'full_payment' && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-success mt-2 bg-success/5 p-2 rounded-lg border border-success/10">
                        ✅ ডেলিভারির সময় আর কোনো টাকা দিতে হবে না
                      </motion.p>
                    )}
                  </div>

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
                    const payAmount = paymentType === 'full_payment' ? grandTotal : deliveryCharge;
                    if (!currentNumber) return null;
                    return (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-gold/5 border border-gold/15">
                        <div>
                          <p className="text-xs text-muted-foreground">{labelMap[payMethod]} নম্বরে ৳{formatBengaliPrice(payAmount)} পাঠান</p>
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

            {/* Turnstile Widget */}
            {turnstileEnabled && (
              <div ref={turnstileRef} className="flex justify-center" />
            )}

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={loading || fraudLoading}
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
