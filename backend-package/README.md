# 🚀 Smart Watch Pro — সম্পূর্ণ ব্যাকএন্ড ডিপ্লয়মেন্ট প্যাকেজ

> এই প্যাকেজে আপনার প্রজেক্টের সম্পূর্ণ ব্যাকএন্ড রয়েছে — Supabase-এ সেলফ-হোস্ট করার জন্য প্রস্তুত।
> কোনো Lovable নির্ভরতা নেই। ১০০% Standard Supabase কম্প্যাটিবল।

---

## 📁 ফোল্ডার স্ট্রাকচার

```
backend-package/
├── README.md                          ← এই ফাইল (মাস্টার গাইড)
├── config.toml                        ← Supabase প্রজেক্ট কনফিগারেশন
│
├── sql/
│   ├── 01-enums.sql                   ← Enum types তৈরি
│   ├── 02-tables.sql                  ← সব টেবিল তৈরি
│   ├── 03-functions.sql               ← Security functions
│   ├── 04-rls-policies.sql            ← Row Level Security policies
│   ├── 05-storage-policies.sql        ← Storage bucket policies
│   ├── 06-indexes.sql                 ← Performance indexes
│   └── 07-initial-data.sql            ← প্রাথমিক ডাটা ইনসার্ট
│
├── functions/
│   ├── auth-email-hook/
│   │   ├── index.ts                   ← Auth ইমেইল (Resend দিয়ে)
│   │   └── deno.json
│   ├── _shared/
│   │   └── email-templates/
│   │       ├── signup.tsx
│   │       ├── invite.tsx
│   │       ├── magic-link.tsx
│   │       ├── recovery.tsx
│   │       ├── email-change.tsx
│   │       └── reauthentication.tsx
│   ├── create-order/index.ts          ← অর্ডার তৈরি (server-side verified)
│   ├── check-fraud/index.ts           ← ফ্রড চেকার API
│   ├── send-order-email/index.ts      ← অর্ডার ইমেইল নোটিফিকেশন
│   ├── book-redx-courier/index.ts     ← RedX কুরিয়ার বুকিং
│   ├── book-steadfast-courier/index.ts← Steadfast কুরিয়ার বুকিং
│   ├── book-pathao-courier/index.ts   ← Pathao কুরিয়ার বুকিং
│   ├── courier-webhook/index.ts       ← কুরিয়ার স্ট্যাটাস webhook
│   ├── track-courier/index.ts         ← লাইভ ট্র্যাকিং
│   └── fetch-areas/index.ts           ← এলাকা লুকআপ
│
└── deploy.sh                          ← ওয়ান-ক্লিক ডিপ্লয় স্ক্রিপ্ট
```

---

## 🔧 ধাপে ধাপে সেটআপ

### ধাপ ১: Supabase প্রজেক্ট তৈরি

1. [supabase.com](https://supabase.com) → **Sign Up** → **New Project**
2. নাম দিন, পাসওয়ার্ড দিন, Region: `Southeast Asia (Singapore)`
3. **Settings → API** থেকে নোট করুন:
   - `Project URL` (যেমন: `https://abcxyz.supabase.co`)
   - `anon public key`
   - `service_role key` ⚠️ সিক্রেট — কাউকে দেবেন না

### ধাপ ২: ডাটাবেজ সেটআপ (SQL Editor)

**Supabase Dashboard → SQL Editor** এ যান এবং **ক্রমানুসারে** প্রতিটি SQL ফাইল রান করুন:

```
01-enums.sql        → প্রথমে রান করুন
02-tables.sql       → দ্বিতীয়
03-functions.sql    → তৃতীয়
04-rls-policies.sql → চতুর্থ
05-storage-policies.sql → পঞ্চম
06-indexes.sql      → ষষ্ঠ
07-initial-data.sql → সপ্তম (ঐচ্ছিক)
```

### ধাপ ৩: Storage Buckets তৈরি

**Supabase Dashboard → Storage** এ যান:
1. **New Bucket** → `product-images` → ✅ Public → Create
2. **New Bucket** → `review-images` → ✅ Public → Create
3. **New Bucket** → `brand-assets` → ✅ Public → Create

তারপর `05-storage-policies.sql` রান করুন (ধাপ ২ এ করে থাকলে স্কিপ করুন)।

### ধাপ ৪: Supabase CLI ইনস্টল ও লিংক

```bash
# CLI ইনস্টল
npm install -g supabase

# লগইন
supabase login

# প্রজেক্ট লিংক
# YOUR_PROJECT_REF = Settings → General → Reference ID
supabase link --project-ref YOUR_PROJECT_REF
```

### ধাপ ৫: Edge Functions ডিপ্লয়

**Option A: স্ক্রিপ্ট দিয়ে (সহজ)**

```bash
chmod +x deploy.sh
./deploy.sh
```

**Option B: ম্যানুয়ালি**

`functions/` ফোল্ডারের সব ফাইল আপনার `supabase/functions/` ফোল্ডারে কপি করুন, তারপর:

```bash
supabase functions deploy auth-email-hook --no-verify-jwt
supabase functions deploy create-order --no-verify-jwt
supabase functions deploy check-fraud --no-verify-jwt
supabase functions deploy send-order-email --no-verify-jwt
supabase functions deploy book-redx-courier --no-verify-jwt
supabase functions deploy book-steadfast-courier --no-verify-jwt
supabase functions deploy book-pathao-courier --no-verify-jwt
supabase functions deploy courier-webhook --no-verify-jwt
supabase functions deploy track-courier --no-verify-jwt
supabase functions deploy fetch-areas --no-verify-jwt
```

### ধাপ ৬: Secrets কনফিগার

```bash
# প্রয়োজনীয় (ইমেইল পাঠানোর জন্য)
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxx

# প্রয়োজনীয় (ফ্রড চেকার)
supabase secrets set FRAUD_CHECKER_API_KEY=your_fraud_api_key

# ঐচ্ছিক (কাস্টম ইমেইল সেটআপ)
supabase secrets set SITE_URL=https://yourdomain.com
supabase secrets set FROM_EMAIL="Your Brand <noreply@yourdomain.com>"
```

> ⚡ `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` স্বয়ংক্রিয়ভাবে সেট থাকে।

### ধাপ ৭: ফ্রন্টএন্ড কনফিগার

আপনার প্রজেক্ট ফোল্ডারে `.env` ফাইল:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_ANON_KEY
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
```

### ধাপ ৮: ফ্রন্টএন্ড বিল্ড ও হোস্ট

```bash
npm install
npm run build
```

`dist/` ফোল্ডার আপনার হোস্টিং-এ আপলোড করুন।

**SPA Redirect সেটআপ:**

| হোস্টিং | ফাইল | কন্টেন্ট |
|---------|------|---------|
| cPanel/Apache | `.htaccess` | `RewriteEngine On`<br>`RewriteBase /`<br>`RewriteRule ^index\.html$ - [L]`<br>`RewriteCond %{REQUEST_FILENAME} !-f`<br>`RewriteCond %{REQUEST_FILENAME} !-d`<br>`RewriteRule . /index.html [L]` |
| Netlify | `public/_redirects` | `/* /index.html 200` |
| Vercel | `vercel.json` | `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}` |

### ধাপ ৯: প্রথম অ্যাডমিন তৈরি

1. সাইটে **Sign Up** করুন
2. ইমেইল ভেরিফাই করুন
3. **Supabase Dashboard → Authentication → Users** → UID কপি
4. **SQL Editor** এ:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('আপনার-UID', 'admin');
```

### ধাপ ১০: কুরিয়ার Webhook URL আপডেট

কুরিয়ার প্রোভাইডারের Dashboard-এ webhook URL সেট করুন:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/courier-webhook
```

---

## ⚠️ গুরুত্বপূর্ণ নোট

| বিষয় | বিবরণ |
|-------|--------|
| **send-order-email** | `ADMIN_EMAIL` ভেরিয়েবল (`shorifulmia085@gmail.com`) আপনার ইমেইলে পরিবর্তন করুন |
| **Resend ফ্রি প্ল্যান** | `onboarding@resend.dev` থেকে পাঠায়। কাস্টম ডোমেইন: Resend Dashboard-এ ডোমেইন verify করুন |
| **auth-email-hook** | `SITE_NAME` ভেরিয়েবল আপনার ব্র্যান্ডের নামে পরিবর্তন করুন |
| **Turnstile** | ব্যবহার করতে চাইলে `.env`-এ `VITE_TURNSTILE_SITE_KEY` এবং secrets-এ `TURNSTILE_SECRET_KEY` যোগ করুন |

---

## ✅ ডিপ্লয়মেন্ট চেকলিস্ট

- [ ] Supabase প্রজেক্ট তৈরি
- [ ] SQL ফাইলগুলো ক্রমানুসারে রান
- [ ] Storage Buckets তৈরি
- [ ] Supabase CLI ইনস্টল ও লিংক
- [ ] Edge Functions ডিপ্লয়
- [ ] RESEND_API_KEY সিক্রেট সেট
- [ ] FRAUD_CHECKER_API_KEY সিক্রেট সেট
- [ ] .env ফাইল আপডেট
- [ ] ফ্রন্টএন্ড বিল্ড ও হোস্টিং
- [ ] SPA redirect কনফিগার
- [ ] প্রথম অ্যাডমিন ইউজার তৈরি
- [ ] কুরিয়ার webhook URL আপডেট
- [ ] টেস্ট অর্ডার দিয়ে যাচাই
- [ ] send-order-email এ ADMIN_EMAIL আপডেট
