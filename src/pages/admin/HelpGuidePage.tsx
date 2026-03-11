import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, LayoutDashboard, ShoppingCart, Package, Users, Star, UsersRound, ShieldCheck, Tag, CreditCard, Wallet, Truck, Route, MessageSquare, BarChart3, Link2, Activity, Settings2, UserCog } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GuideSection {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  description: string;
  steps: { title: string; detail: string }[];
}

const guides: GuideSection[] = [
  {
    id: 'dashboard',
    title: 'ড্যাশবোর্ড',
    icon: LayoutDashboard,
    color: 'text-accent',
    description: 'ব্যবসার সার্বিক অবস্থা এক নজরে দেখুন।',
    steps: [
      { title: 'সামারি কার্ড', detail: 'মোট অর্ডার, রাজস্ব, পেন্ডিং অর্ডার, আজকের অর্ডার সহ ১০টি গুরুত্বপূর্ণ পরিসংখ্যান দেখুন।' },
      { title: 'সময় ফিল্টার', detail: 'উপরের প্রিসেট বাটন থেকে আজ, ৭ দিন, ৩০ দিন, বা সব সময়ের ডেটা দেখতে পারবেন।' },
      { title: 'দৈনিক প্রফিট', detail: 'প্রোডাক্টের সোর্সিং কস্ট বাদ দিয়ে আনুমানিক দৈনিক ও মাসিক প্রফিট ক্যালকুলেশন দেখুন।' },
      { title: 'স্ট্যাটাস ব্রেকডাউন', detail: 'পেন্ডিং, প্রসেসিং, শিপড, সম্পন্ন, ক্যানসেল, রিটার্ন — প্রতিটি স্ট্যাটাসের সংখ্যা দেখুন।' },
    ],
  },
  {
    id: 'orders',
    title: 'অর্ডার ম্যানেজমেন্ট',
    icon: ShoppingCart,
    color: 'text-info',
    description: 'সকল অর্ডার দেখুন, ফিল্টার করুন, স্ট্যাটাস পরিবর্তন করুন এবং কুরিয়ার বুক করুন।',
    steps: [
      { title: 'অর্ডার টেবিল', detail: 'সকল অর্ডার একটি টেবিলে দেখুন — কাস্টমারের নাম, ফোন, ঠিকানা, প্রোডাক্ট, মূল্য, পেমেন্ট মেথড সহ সব তথ্য।' },
      { title: 'সার্চ করুন', detail: 'উপরের সার্চ বারে কাস্টমারের নাম, ফোন নম্বর, প্রোডাক্ট নাম বা ট্রানজেকশন আইডি দিয়ে সার্চ করুন।' },
      { title: 'ফিল্টার', detail: 'স্ট্যাটাস (পেন্ডিং, শিপড ইত্যাদি), পেমেন্ট টাইপ (COD / অনলাইন), এবং কুরিয়ার প্রোভাইডার (RedX, Pathao, Steadfast) দিয়ে ফিল্টার করুন।' },
      { title: 'স্ট্যাটাস পরিবর্তন', detail: 'প্রতিটি অর্ডারের ড্রপডাউন থেকে স্ট্যাটাস পরিবর্তন করুন — pending → processing → shipped → completed।' },
      { title: 'কুরিয়ার বুকিং', detail: 'অর্ডারের পাশের Truck আইকনে ক্লিক করে সরাসরি RedX, Pathao বা Steadfast-এ কুরিয়ার বুক করুন।' },
      { title: 'ফ্রড চেক (Shield আইকন)', detail: 'প্রতিটি অর্ডারে Shield আইকনে ক্লিক করে কাস্টমারের ফোন নম্বর দিয়ে ম্যানুয়াল ফ্রড চেক করুন।' },
      { title: 'রিস্ক ইন্ডিকেটর', detail: 'সবুজ = নিরাপদ, হলুদ = সতর্ক, লাল = ঝুঁকিপূর্ণ — অটোমেটিক ফ্রড অ্যানালাইসিসের উপর ভিত্তি করে।' },
      { title: 'অর্ডার নোটস', detail: 'প্রতিটি অর্ডারের MessageSquare আইকনে ক্লিক করে অভ্যন্তরীণ নোট যোগ করুন — টিম কমিউনিকেশনের জন্য।' },
      { title: 'PDF ডাউনলোড', detail: 'সিলেক্টেড অর্ডার বা সব অর্ডার PDF আকারে ডাউনলোড করুন।' },
      { title: 'বাল্ক অ্যাকশন', detail: 'চেকবক্স দিয়ে একাধিক অর্ডার সিলেক্ট করে একসাথে স্ট্যাটাস পরিবর্তন করুন।' },
    ],
  },
  {
    id: 'products',
    title: 'প্রোডাক্ট ম্যানেজমেন্ট',
    icon: Package,
    color: 'text-success',
    description: 'প্রোডাক্ট যোগ করুন, এডিট করুন, ছবি আপলোড করুন এবং স্টক ম্যানেজ করুন।',
    steps: [
      { title: 'নতুন প্রোডাক্ট যোগ', detail: '"নতুন প্রোডাক্ট" বাটনে ক্লিক করুন। নাম, দাম, সোর্সিং কস্ট, ছাড়, ক্যাটাগরি ইত্যাদি পূরণ করুন।' },
      { title: 'ছবি আপলোড', detail: 'একাধিক প্রোডাক্ট ইমেজ আপলোড করুন। প্রথম ইমেজটি থাম্বনেইল হিসেবে ব্যবহার হবে। ড্র্যাগ করে সর্ট করুন।' },
      { title: 'কালার অপশন', detail: 'Available Colors ফিল্ডে কমা দিয়ে রঙের নাম লিখুন (যেমন: কালো, সিলভার, গোল্ড)। কাস্টমার অর্ডারের সময় সিলেক্ট করতে পারবে।' },
      { title: 'ভিডিও URL', detail: 'YouTube ভিডিও লিংক দিন — ল্যান্ডিং পেজে ভিডিও সেকশনে অটোমেটিক দেখাবে। খালি রাখলে সেকশন লুকিয়ে যাবে।' },
      { title: 'ফিচার লিস্ট', detail: 'প্রোডাক্টের ফিচার যোগ করুন — আইকন (ইমোজি/URL) + শিরোনাম + বর্ণনা। ল্যান্ডিং পেজে কার্ড আকারে দেখাবে।' },
      { title: 'স্টক স্ট্যাটাস', detail: 'In Stock / Out of Stock সিলেক্ট করুন। Out of Stock হলে কাস্টমার অর্ডার করতে পারবে না।' },
      { title: 'Featured প্রোডাক্ট', detail: 'Is Featured চালু করলে প্রোডাক্টটি ল্যান্ডিং পেজে প্রথমে দেখাবে।' },
      { title: 'SEO সেটিংস', detail: 'Meta Title ও Meta Description পূরণ করুন — সার্চ ইঞ্জিন অপটিমাইজেশনের জন্য।' },
      { title: 'সোর্সিং কস্ট', detail: 'প্রোডাক্টের ক্রয় মূল্য দিন — ড্যাশবোর্ডে প্রফিট ক্যালকুলেশনে ব্যবহার হবে।' },
    ],
  },
  {
    id: 'customers',
    title: 'কাস্টমার',
    icon: Users,
    color: 'text-warning',
    description: 'সকল কাস্টমারের তথ্য, অর্ডার হিস্ট্রি এবং পরিসংখ্যান দেখুন।',
    steps: [
      { title: 'কাস্টমার লিস্ট', detail: 'ফোন নম্বর অনুযায়ী ইউনিক কাস্টমারদের লিস্ট দেখুন — মোট অর্ডার সংখ্যা ও মোট খরচ সহ।' },
      { title: 'সার্চ', detail: 'কাস্টমারের নাম বা ফোন নম্বর দিয়ে সার্চ করুন।' },
      { title: 'রিপিট কাস্টমার', detail: 'একাধিক অর্ডার করেছেন এমন কাস্টমারদের চিহ্নিত করুন — Crown আইকন দিয়ে বোঝানো হয়।' },
    ],
  },
  {
    id: 'reviews',
    title: 'রিভিউ ম্যানেজমেন্ট',
    icon: Star,
    color: 'text-gold',
    description: 'কাস্টমার রিভিউ ইমেজ আপলোড ও ম্যানেজ করুন।',
    steps: [
      { title: 'রিভিউ ইমেজ আপলোড', detail: 'কাস্টমার রিভিউ স্ক্রিনশট বা ফটো আপলোড করুন। ল্যান্ডিং পেজে গ্যালারি আকারে দেখাবে।' },
      { title: 'প্রোডাক্ট অ্যাসাইন', detail: 'প্রতিটি রিভিউ ইমেজ নির্দিষ্ট প্রোডাক্টের সাথে সংযুক্ত করুন।' },
      { title: 'সর্ট অর্ডার', detail: 'ড্র্যাগ করে বা নম্বর দিয়ে রিভিউ ইমেজের ক্রম পরিবর্তন করুন।' },
    ],
  },
  {
    id: 'team',
    title: 'টিম ম্যানেজমেন্ট',
    icon: UsersRound,
    color: 'text-info',
    description: 'টিম মেম্বার যোগ করুন, রোল অ্যাসাইন করুন এবং অ্যাক্সেস কন্ট্রোল করুন।',
    steps: [
      { title: 'মেম্বার যোগ', detail: 'নতুন টিম মেম্বারের ইমেইল দিন এবং রোল সিলেক্ট করুন (Admin বা Order Manager)।' },
      { title: 'রোল ভিত্তিক অ্যাক্সেস', detail: 'Admin — সব কিছুতে অ্যাক্সেস। Order Manager — শুধু অর্ডার, ট্র্যাকিং ও প্রোফাইলে অ্যাক্সেস।' },
      { title: 'মেম্বার রিমুভ', detail: 'টিম মেম্বারের পাশের ডিলিট বাটনে ক্লিক করে রিমুভ করুন। সুপার অ্যাডমিনকে রিমুভ করা যায় না।' },
      { title: 'সুপার অ্যাডমিন', detail: 'প্রথম রেজিস্টার্ড অ্যাডমিন স্বয়ংক্রিয়ভাবে সুপার অ্যাডমিন। শুধু সুপার অ্যাডমিন নতুন অ্যাডমিন যোগ করতে পারে।' },
    ],
  },
  {
    id: 'fraud',
    title: 'ফ্রড চেকার',
    icon: ShieldCheck,
    color: 'text-destructive',
    description: 'কাস্টমারের ফোন নম্বর দিয়ে ফ্রড রিস্ক যাচাই করুন।',
    steps: [
      { title: 'ফোন নম্বর দিন', detail: 'কাস্টমারের ১১ ডিজিটের ফোন নম্বর ইনপুট করুন এবং "চেক করুন" বাটনে ক্লিক করুন।' },
      { title: 'রেজাল্ট দেখুন', detail: 'মোট পার্সেল, ডেলিভারি, ক্যানসেল সংখ্যা এবং সাকসেস রেট দেখুন।' },
      { title: 'রিস্ক লেভেল', detail: 'সবুজ = নিরাপদ (সাকসেস রেট ভালো), হলুদ = সতর্ক, লাল = ঝুঁকিপূর্ণ (বেশি ক্যানসেল)।' },
      { title: 'মিনিমাম সাকসেস রেট', detail: 'সাইট কন্ট্রোল থেকে মিনিমাম সাকসেস রেট সেট করুন। এর নিচে থাকলে COD ব্লক হবে।' },
    ],
  },
  {
    id: 'coupons',
    title: 'কুপন ম্যানেজমেন্ট',
    icon: Tag,
    color: 'text-accent',
    description: 'ডিসকাউন্ট কুপন তৈরি ও ম্যানেজ করুন।',
    steps: [
      { title: 'নতুন কুপন তৈরি', detail: '"নতুন কুপন" বাটনে ক্লিক করুন। কুপন কোড, ডিসকাউন্ট টাইপ (শতাংশ বা নির্দিষ্ট টাকা), এবং মান দিন।' },
      { title: 'মিনিমাম অর্ডার', detail: 'কুপন কাজ করার জন্য মিনিমাম অর্ডার অ্যামাউন্ট সেট করুন।' },
      { title: 'ব্যবহার সীমা', detail: 'Max Uses দিয়ে কুপনটি কতবার ব্যবহার করা যাবে তা সেট করুন। খালি রাখলে সীমাহীন।' },
      { title: 'মেয়াদ', detail: 'Expires At দিয়ে কুপনের মেয়াদ শেষের তারিখ সেট করুন।' },
      { title: 'চালু/বন্ধ', detail: 'Is Active টগল দিয়ে কুপন সক্রিয় বা নিষ্ক্রিয় করুন।' },
    ],
  },
  {
    id: 'payment',
    title: 'পেমেন্ট সেটিংস',
    icon: CreditCard,
    color: 'text-success',
    description: 'বিকাশ, নগদ, রকেট নম্বর সেট করুন এবং অনলাইন পেমেন্ট চালু/বন্ধ করুন।',
    steps: [
      { title: 'মোবাইল ব্যাংকিং নম্বর', detail: 'বিকাশ, নগদ ও রকেটের মার্চেন্ট/পার্সোনাল নম্বর সেট করুন। অর্ডার ফর্মে এই নম্বরগুলো দেখাবে।' },
      { title: 'অনলাইন পেমেন্ট টগল', detail: '"অনলাইন পেমেন্ট চালু" টগল বন্ধ করলে শুধু COD অপশন থাকবে।' },
    ],
  },
  {
    id: 'advance-payments',
    title: 'অগ্রিম পেমেন্ট',
    icon: Wallet,
    color: 'text-warning',
    description: 'অনলাইন পেমেন্টে কাস্টমারদের অগ্রিম পেমেন্ট ট্র্যাক করুন।',
    steps: [
      { title: 'অগ্রিম পেমেন্ট লিস্ট', detail: 'অনলাইন পেমেন্ট করা সকল অর্ডারের অগ্রিম পেমেন্ট, ট্রানজেকশন আইডি এবং স্ট্যাটাস দেখুন।' },
      { title: 'ফিল্টার', detail: 'পেইড / আনপেইড ফিল্টার করুন এবং সার্চ করুন।' },
      { title: 'পেমেন্ট ভেরিফাই', detail: 'ট্রানজেকশন আইডি দেখে ম্যানুয়ালি পেমেন্ট ভেরিফাই করুন।' },
    ],
  },
  {
    id: 'courier',
    title: 'কুরিয়ার সেটিংস',
    icon: Truck,
    color: 'text-info',
    description: 'RedX, Pathao এবং Steadfast কুরিয়ার সার্ভিস কনফিগার করুন।',
    steps: [
      { title: 'কুরিয়ার প্রোভাইডার সিলেক্ট', detail: 'RedX, Pathao বা Steadfast — যেকোনো একটি বা একাধিক কুরিয়ার সার্ভিস চালু করুন।' },
      { title: 'API Key দিন', detail: 'প্রতিটি কুরিয়ারের API Key ও Secret দিন। Sandbox (টেস্ট) ও Production (লাইভ) আলাদাভাবে কনফিগার করুন।' },
      { title: 'Sandbox মোড', detail: 'প্রথমে Sandbox মোডে টেস্ট করুন। সবকিছু ঠিক থাকলে Production-এ সুইচ করুন।' },
      { title: 'সক্রিয়/নিষ্ক্রিয়', detail: 'Is Active টগল দিয়ে নির্দিষ্ট কুরিয়ার চালু/বন্ধ করুন।' },
    ],
  },
  {
    id: 'courier-payments',
    title: 'কুরিয়ার পেমেন্ট',
    icon: Wallet,
    color: 'text-gold',
    description: 'কুরিয়ার থেকে প্রাপ্য পেমেন্ট ট্র্যাক করুন।',
    steps: [
      { title: 'পেমেন্ট সামারি', detail: 'মোট COD কালেকশন, ডেলিভারি চার্জ এবং প্রাপ্য পেমেন্টের সামারি দেখুন।' },
      { title: 'স্ট্যাটাস ভিত্তিক', detail: 'সম্পন্ন অর্ডারের ভিত্তিতে কুরিয়ার থেকে কত টাকা পাওনা আছে তা ক্যালকুলেট হয়।' },
    ],
  },
  {
    id: 'tracking',
    title: 'ট্র্যাকিং ড্যাশবোর্ড',
    icon: Route,
    color: 'text-accent',
    description: 'সকল শিপমেন্টের লাইভ ট্র্যাকিং ও স্ট্যাটাস দেখুন।',
    steps: [
      { title: 'শিপমেন্ট ওভারভিউ', detail: 'মোট শিপড, ডেলিভারড, ইন-ট্রানজিট ও রিটার্নের সংখ্যা দেখুন।' },
      { title: 'লাইভ ট্র্যাকিং', detail: 'প্রতিটি অর্ডারের কুরিয়ার ট্র্যাকিং আইডি দিয়ে রিয়েল-টাইম ট্র্যাকিং দেখুন।' },
      { title: 'লোকেশন ব্রেকডাউন', detail: 'বিভাগ ও জেলা অনুযায়ী শিপমেন্ট পরিসংখ্যান দেখুন।' },
    ],
  },
  {
    id: 'sms',
    title: 'SMS সেটিংস',
    icon: MessageSquare,
    color: 'text-success',
    description: 'অটোমেটিক SMS নোটিফিকেশন কনফিগার করুন।',
    steps: [
      { title: 'SMS প্রোভাইডার', detail: 'BulkSMSBD বা অন্যান্য SMS API প্রোভাইডার সেটআপ করুন।' },
      { title: 'API Key', detail: 'আপনার SMS প্রোভাইডারের API Key ও Sender ID দিন।' },
      { title: 'টেমপ্লেট কাস্টমাইজ', detail: 'অর্ডার কনফার্মেশন, শিপমেন্ট ও ডেলিভারি SMS-এর টেমপ্লেট কাস্টমাইজ করুন। {name}, {order_id}, {total}, {tracking_id} ভেরিয়েবল ব্যবহার করুন।' },
      { title: 'চালু/বন্ধ', detail: 'Is Active টগল দিয়ে SMS সার্ভিস চালু বা বন্ধ করুন।' },
    ],
  },
  {
    id: 'analytics',
    title: 'অ্যানালিটিক্স',
    icon: BarChart3,
    color: 'text-info',
    description: 'বিক্রয়, প্রোডাক্ট, লোকেশন ও মার্কেটিং অ্যানালিটিক্স দেখুন।',
    steps: [
      { title: 'রেভিনিউ ট্রেন্ড', detail: 'দৈনিক রেভিনিউ ও অর্ডার সংখ্যার গ্রাফ দেখুন। ৭, ১৪, ৩০ বা ৯০ দিনের ডেটা ফিল্টার করুন।' },
      { title: 'টপ প্রোডাক্ট', detail: 'সবচেয়ে বেশি বিক্রিত ৫টি প্রোডাক্টের চার্ট ও র‍্যাংকিং দেখুন।' },
      { title: 'ট্র্যাফিক সোর্স', detail: 'কোন সোর্স (Facebook, TikTok, YouTube ইত্যাদি) থেকে কত অর্ডার আসছে — পাই চার্ট ও বিস্তারিত দেখুন।' },
      { title: 'সোর্স × মিডিয়াম', detail: 'সোর্স ও মিডিয়ামের কম্বিনেশন অ্যানালাইসিস (যেমন: facebook / cpc, tiktok / organic)।' },
      { title: 'ক্যাম্পেইন পারফরম্যান্স', detail: 'UTM ক্যাম্পেইন অনুযায়ী অর্ডার সংখ্যা, রেভিনিউ ও গড় অর্ডার ভ্যালু দেখুন।' },
      { title: 'লোকেশন অ্যানালিটিক্স', detail: 'বিভাগ ও জেলা অনুযায়ী অর্ডার বিশ্লেষণ দেখুন।' },
      { title: 'মাসিক প্রফিট', detail: 'এই মাস ও আগের মাসের প্রফিট তুলনা এবং সোর্সিং কস্ট, ডেলিভারি চার্জ ব্রেকডাউন দেখুন।' },
    ],
  },
  {
    id: 'utm',
    title: 'UTM Builder',
    icon: Link2,
    color: 'text-gold',
    description: 'মার্কেটিং ক্যাম্পেইনের জন্য ট্র্যাকেবল UTM লিংক তৈরি করুন।',
    steps: [
      { title: 'বেস URL', detail: 'আপনার ওয়েবসাইটের URL অটোমেটিক বসানো থাকবে। চাইলে পরিবর্তন করুন।' },
      { title: 'সোর্স সিলেক্ট', detail: 'প্রিসেট থেকে Facebook, TikTok, YouTube বা Google সিলেক্ট করুন, অথবা নিজে লিখুন।' },
      { title: 'মিডিয়াম সিলেক্ট', detail: 'CPC (পেইড অ্যাড), Organic (ফ্রি পোস্ট), Video ইত্যাদি থেকে সিলেক্ট করুন।' },
      { title: 'ক্যাম্পেইন নাম', detail: 'ক্যাম্পেইনের একটি সংক্ষিপ্ত নাম দিন (যেমন: eid_offer, summer_sale)।' },
      { title: 'লিংক কপি', detail: 'তৈরি হওয়া লিংক এক ক্লিকে কপি করুন এবং আপনার অ্যাড ক্যাম্পেইনে ব্যবহার করুন।' },
      { title: 'লিংক সেভ', detail: 'তৈরি করা লিংক সেভ করুন — পরে আবার দ্রুত অ্যাক্সেস করতে পারবেন।' },
    ],
  },
  {
    id: 'pixel',
    title: 'Facebook Pixel',
    icon: Activity,
    color: 'text-info',
    description: 'Facebook Pixel কনফিগার করে কনভার্সন ট্র্যাকিং চালু করুন।',
    steps: [
      { title: 'Pixel ID', detail: 'আপনার Facebook Business Manager থেকে Pixel ID কপি করে এখানে পেস্ট করুন।' },
      { title: 'Access Token', detail: 'Conversions API-এর জন্য Access Token দিন (ঐচ্ছিক কিন্তু উচিত)।' },
      { title: 'ইভেন্ট সিলেক্ট', detail: 'কোন কোন ইভেন্ট ট্র্যাক করতে চান সিলেক্ট করুন — PageView, Purchase, AddToCart ইত্যাদি।' },
    ],
  },
  {
    id: 'settings',
    title: 'সাইট কন্ট্রোল',
    icon: Settings2,
    color: 'text-muted-foreground',
    description: 'ওয়েবসাইটের সমস্ত গুরুত্বপূর্ণ সেটিংস একই জায়গায় ম্যানেজ করুন।',
    steps: [
      { title: 'ব্র্যান্ডিং', detail: 'ব্র্যান্ড নাম, ট্যাগলাইন, লোগো আপলোড এবং প্রাইমারি কালার সেট করুন।' },
      { title: 'অ্যানাউন্সমেন্ট বার', detail: 'ওয়েবসাইটের উপরে দেখানো অ্যানাউন্সমেন্ট টেক্সট, ছাড়ের শতাংশ এবং কাউন্টডাউন টাইমার কনফিগার করুন।' },
      { title: 'অফার সময়সীমা', detail: 'অফার শুরু ও শেষের তারিখ-সময় সেট করুন। টাইমার সেই অনুযায়ী চলবে।' },
      { title: 'পেজ কন্টেন্ট', detail: 'হিরো সাবটাইটেল, ফিচার সেকশন শিরোনাম, ভিডিও সেকশন শিরোনাম ইত্যাদি পরিবর্তন করুন।' },
      { title: 'ফুটার ও CTA', detail: 'ফুটারের CTA শিরোনাম, সাবটাইটেল ও কপিরাইট টেক্সট পরিবর্তন করুন।' },
      { title: 'WhatsApp নম্বর', detail: 'WhatsApp বাটনে যে নম্বর দেখাবে তা সেট করুন (দেশ কোড সহ, যেমন: 8801XXXXXXXXX)।' },
      { title: 'ফ্রড ডিটেকশন', detail: 'মিনিমাম সাকসেস রেট সেট করুন। এর নিচে থাকলে COD ব্লক হবে এবং অগ্রিম পেমেন্ট বাধ্যতামূলক হবে।' },
      { title: 'ইমেইল নোটিফিকেশন', detail: 'অর্ডার কনফার্মেশন ইমেইল চালু/বন্ধ করুন। চালু থাকলে প্রতি অর্ডারে কাস্টমার ও অ্যাডমিনকে ইমেইল যাবে।' },
    ],
  },
  {
    id: 'profile',
    title: 'প্রোফাইল সেটিংস',
    icon: UserCog,
    color: 'text-accent',
    description: 'আপনার অ্যাকাউন্ট সেটিংস ম্যানেজ করুন।',
    steps: [
      { title: 'পাসওয়ার্ড পরিবর্তন', detail: 'নতুন পাসওয়ার্ড দিয়ে আপনার অ্যাকাউন্টের পাসওয়ার্ড পরিবর্তন করুন।' },
      { title: 'ইমেইল', detail: 'আপনার রেজিস্টার্ড ইমেইল দেখুন।' },
    ],
  },
];

const HelpGuidePage = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm gradient-gold flex items-center justify-center shadow-sm">
            <BookOpen className="h-5 w-5 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">সম্পূর্ণ গাইড</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">অ্যাডমিন প্যানেলের প্রতিটি পেজের বিস্তারিত ব্যবহার নির্দেশিকা</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 p-3 text-center">
          <p className="text-2xl font-bold text-accent font-inter">{guides.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">মোট সেকশন</p>
        </div>
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 p-3 text-center">
          <p className="text-2xl font-bold text-success font-inter">{guides.reduce((s, g) => s + g.steps.length, 0)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">মোট স্টেপ</p>
        </div>
        <div className="bg-surface dark:bg-card rounded-sm border border-border/30 p-3 text-center sm:col-span-1 col-span-2">
          <p className="text-2xl font-bold text-warning font-inter">A-Z</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">সম্পূর্ণ কভারেজ</p>
        </div>
      </div>

      {/* Guide Sections */}
      <div className="space-y-2">
        {guides.map((guide) => {
          const isOpen = expandedId === guide.id;
          const Icon = guide.icon;
          return (
            <div key={guide.id} className="bg-surface dark:bg-card rounded-sm border border-border/30 shadow-sm overflow-hidden">
              {/* Header */}
              <button
                onClick={() => toggle(guide.id)}
                className="w-full flex items-center gap-3 p-4 md:p-5 text-left hover:bg-muted/10 transition-colors"
              >
                <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 ${isOpen ? 'gradient-gold' : 'bg-muted/30'}`}>
                  <Icon className={`h-[18px] w-[18px] ${isOpen ? 'text-white' : guide.color}`} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isOpen ? 'text-accent' : 'text-foreground'} transition-colors`}>{guide.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{guide.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-sm font-inter">{guide.steps.length} স্টেপ</span>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-accent" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {/* Steps */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 md:px-5 pb-5 pt-1 space-y-2.5">
                      {guide.steps.map((step, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-sm bg-muted/5 border border-border/20 hover:bg-muted/15 transition-colors">
                          <div className="w-6 h-6 rounded-sm bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-accent font-inter">{i + 1}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">{step.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{step.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HelpGuidePage;
