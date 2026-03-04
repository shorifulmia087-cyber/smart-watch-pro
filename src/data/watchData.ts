import watchHero1 from '@/assets/watch-hero-1.jpg';
import watchHero2 from '@/assets/watch-hero-2.jpg';
import watchHero3 from '@/assets/watch-hero-3.jpg';
import watchCol1 from '@/assets/watch-collection-1.jpg';
import watchCol2 from '@/assets/watch-collection-2.jpg';
import watchCol3 from '@/assets/watch-collection-3.jpg';

export interface WatchFeature {
  icon: string;
  title: string;
  desc: string;
}

export interface WatchProduct {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  images: { src: string; label: string }[];
  thumbnail: string;
  videoUrl: string;
  features: WatchFeature[];
}

export const watchCollection: WatchProduct[] = [
  {
    id: 'kronos-sovereign',
    name: 'Kronos Sovereign',
    subtitle: 'সময়ের সাথে যারা এগিয়ে থাকে, তাদের হাতে থাকে Kronos।',
    price: 2990,
    images: [
      { src: watchHero1, label: 'Kronos Sovereign — গোল্ড এডিশন' },
      { src: watchHero2, label: 'Kronos Elite — রিস্ট শট' },
      { src: watchHero3, label: 'Kronos Classic — সিলভার এডিশন' },
    ],
    thumbnail: watchHero1,
    videoUrl: 'dQw4w9WgXcQ',
    features: [
      { icon: '🛡️', title: 'আজীবন ওয়ারেন্টি', desc: 'প্রতিটি ঘড়িতে আজীবন সার্ভিস গ্যারান্টি।' },
      { icon: '💧', title: 'ওয়াটারপ্রুফ ডিজাইন', desc: '৫০ মিটার পর্যন্ত জল-প্রতিরোধী।' },
      { icon: '⚙️', title: 'জাপানিজ মুভমেন্ট', desc: 'মিয়োটা কোয়ার্টজ ইঞ্জিন, নিখুঁত সময়।' },
      { icon: '🏅', title: 'প্রিমিয়াম উপকরণ', desc: 'স্টেইনলেস স্টিল কেস, স্যাফায়ার গ্লাস।' },
      { icon: '🚚', title: 'সারাদেশে ডেলিভারি', desc: 'ক্যাশ অন ডেলিভারি সুবিধা।' },
      { icon: '🔄', title: '৭ দিনে রিটার্ন', desc: 'সন্তুষ্ট না হলে ফেরত দিন।' },
    ],
  },
  {
    id: 'kronos-noir',
    name: 'Kronos Noir',
    subtitle: 'রাতের গভীরতা, হাতের কব্জিতে। Kronos Noir — অন্ধকারের রাজা।',
    price: 3490,
    images: [
      { src: watchCol1, label: 'Kronos Noir — রোজ গোল্ড' },
      { src: watchHero1, label: 'Kronos Noir — সাইড ভিউ' },
      { src: watchHero3, label: 'Kronos Noir — ডিটেইল' },
    ],
    thumbnail: watchCol1,
    videoUrl: 'dQw4w9WgXcQ',
    features: [
      { icon: '🛡️', title: 'আজীবন ওয়ারেন্টি', desc: 'প্রতিটি ঘড়িতে আজীবন সার্ভিস গ্যারান্টি।' },
      { icon: '🌙', title: 'লুমিনাস ডায়াল', desc: 'অন্ধকারে উজ্জ্বল ডায়াল, সবসময় পড়া যায়।' },
      { icon: '⚙️', title: 'সুইস মুভমেন্ট', desc: 'উচ্চমানের সুইস কোয়ার্টজ ইঞ্জিন।' },
      { icon: '💎', title: 'জেনুইন লেদার', desc: 'ইতালিয়ান লেদার স্ট্র্যাপ, হাতে আরামদায়ক।' },
      { icon: '🚚', title: 'সারাদেশে ডেলিভারি', desc: 'ক্যাশ অন ডেলিভারি সুবিধা।' },
      { icon: '🔄', title: '৭ দিনে রিটার্ন', desc: 'সন্তুষ্ট না হলে ফেরত দিন।' },
    ],
  },
  {
    id: 'kronos-celestial',
    name: 'Kronos Celestial',
    subtitle: 'মিনিমালিজমের শিখর। Kronos Celestial — পরিশীলিত পুরুষের পছন্দ।',
    price: 2790,
    images: [
      { src: watchCol2, label: 'Kronos Celestial — সিলভার মেশ' },
      { src: watchHero2, label: 'Kronos Celestial — রিস্ট শট' },
      { src: watchHero1, label: 'Kronos Celestial — ক্লোজআপ' },
    ],
    thumbnail: watchCol2,
    videoUrl: 'dQw4w9WgXcQ',
    features: [
      { icon: '🛡️', title: 'আজীবন ওয়ারেন্টি', desc: 'প্রতিটি ঘড়িতে আজীবন সার্ভিস গ্যারান্টি।' },
      { icon: '💧', title: 'ওয়াটারপ্রুফ ডিজাইন', desc: '৩০ মিটার পর্যন্ত জল-প্রতিরোধী।' },
      { icon: '⚙️', title: 'জাপানিজ মুভমেন্ট', desc: 'মিয়োটা কোয়ার্টজ ইঞ্জিন।' },
      { icon: '✨', title: 'মেশ ব্রেসলেট', desc: 'স্টেইনলেস স্টিল মেশ, অতি হালকা ও আরামদায়ক।' },
      { icon: '🚚', title: 'সারাদেশে ডেলিভারি', desc: 'ক্যাশ অন ডেলিভারি সুবিধা।' },
      { icon: '🔄', title: '৭ দিনে রিটার্ন', desc: 'সন্তুষ্ট না হলে ফেরত দিন।' },
    ],
  },
  {
    id: 'kronos-aqua',
    name: 'Kronos Aqua',
    subtitle: 'গভীর সমুদ্রের সাহস, কব্জিতে। Kronos Aqua — অ্যাডভেঞ্চারের সঙ্গী।',
    price: 3990,
    images: [
      { src: watchCol3, label: 'Kronos Aqua — ডিপ ব্লু' },
      { src: watchHero3, label: 'Kronos Aqua — সাইড ভিউ' },
      { src: watchHero2, label: 'Kronos Aqua — ডিটেইল' },
    ],
    thumbnail: watchCol3,
    videoUrl: 'dQw4w9WgXcQ',
    features: [
      { icon: '🛡️', title: 'আজীবন ওয়ারেন্টি', desc: 'প্রতিটি ঘড়িতে আজীবন সার্ভিস গ্যারান্টি।' },
      { icon: '💧', title: 'ডাইভার গ্রেড', desc: '২০০ মিটার পর্যন্ত জল-প্রতিরোধী, পেশাদার ডাইভারদের জন্য।' },
      { icon: '⚙️', title: 'অটোম্যাটিক মুভমেন্ট', desc: 'সেইকো NH35 অটোম্যাটিক ক্যালিবার।' },
      { icon: '🏅', title: 'সিরামিক বেজেল', desc: 'স্ক্র্যাচ-প্রুফ সিরামিক রোটেটিং বেজেল।' },
      { icon: '🚚', title: 'সারাদেশে ডেলিভারি', desc: 'ক্যাশ অন ডেলিভারি সুবিধা।' },
      { icon: '🔄', title: '৭ দিনে রিটার্ন', desc: 'সন্তুষ্ট না হলে ফেরত দিন।' },
    ],
  },
];
