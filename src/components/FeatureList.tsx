import { motion } from 'framer-motion';
import { Shield, Droplets, Watch, Award, Truck, RotateCcw } from 'lucide-react';

const features = [
  { icon: Shield, title: 'আজীবন ওয়ারেন্টি', desc: 'প্রতিটি ঘড়িতে আজীবন সার্ভিস গ্যারান্টি।' },
  { icon: Droplets, title: 'ওয়াটারপ্রুফ ডিজাইন', desc: '৫০ মিটার পর্যন্ত জল-প্রতিরোধী।' },
  { icon: Watch, title: 'জাপানিজ মুভমেন্ট', desc: 'মিয়োটা কোয়ার্টজ ইঞ্জিন, নিখুঁত সময়।' },
  { icon: Award, title: 'প্রিমিয়াম উপকরণ', desc: 'স্টেইনলেস স্টিল কেস, স্যাফায়ার গ্লাস।' },
  { icon: Truck, title: 'সারাদেশে ডেলিভারি', desc: 'ক্যাশ অন ডেলিভারি সুবিধা।' },
  { icon: RotateCcw, title: '৭ দিনে রিটার্ন', desc: 'সন্তুষ্ট না হলে ফেরত দিন।' },
];

const FeatureList = () => (
  <section className="bg-ash py-20 px-4">
    <div className="max-w-2xl mx-auto">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-2xl md:text-3xl font-bold text-center mb-12"
      >
        কেন Kronos বেছে নেবেন?
      </motion.h2>
      <div className="space-y-0">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className={`flex items-start gap-4 py-5 ${i < features.length - 1 ? 'border-b border-border' : ''}`}
          >
            <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center shrink-0 mt-0.5">
              <f.icon className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{f.title}</p>
              <p className="text-muted-foreground text-sm mt-0.5">{f.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeatureList;
