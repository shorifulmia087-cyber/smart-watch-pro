#!/bin/bash
# =============================================
# 🔄 ফুল আপডেট স্ক্রিপ্ট — এক কমান্ডে সব!
# ব্যবহার: chmod +x update.sh && ./update.sh
# =============================================

set -e

# কালার
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "${CYAN}   🔄 TickDeal BD — ফুল আপডেট স্ক্রিপ্ট${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""

# প্রজেক্ট রুট খুঁজুন
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"
echo -e "${YELLOW}📁 প্রজেক্ট: $PROJECT_ROOT${NC}"
echo ""

# ──────────────────────────────────
# ধাপ ১: GitHub থেকে লেটেস্ট কোড পুল
# ──────────────────────────────────
echo -e "${CYAN}━━━ ধাপ ১/৪: GitHub থেকে কোড পুল ━━━${NC}"
if git pull origin main; then
  echo -e "${GREEN}✅ লেটেস্ট কোড পুল হয়েছে${NC}"
else
  echo -e "${RED}❌ Git pull ব্যর্থ। ইন্টারনেট কানেকশন চেক করুন।${NC}"
  exit 1
fi
echo ""

# ──────────────────────────────────
# ধাপ ২: Frontend বিল্ড
# ──────────────────────────────────
echo -e "${CYAN}━━━ ধাপ ২/৪: Frontend বিল্ড ━━━${NC}"
if [ ! -f ".env" ]; then
  echo -e "${RED}❌ .env ফাইল পাওয়া যায়নি!${NC}"
  echo "   .env ফাইলে VITE_SUPABASE_URL ও VITE_SUPABASE_PUBLISHABLE_KEY সেট করুন।"
  exit 1
fi

npm install --silent 2>/dev/null
if npm run build; then
  echo -e "${GREEN}✅ Frontend বিল্ড সফল — dist/ ফোল্ডার রেডি${NC}"
else
  echo -e "${RED}❌ বিল্ড ব্যর্থ${NC}"
  exit 1
fi
echo ""

# ──────────────────────────────────
# ধাপ ৩: Edge Functions ডিপ্লয়
# ──────────────────────────────────
echo -e "${CYAN}━━━ ধাপ ৩/৪: Edge Functions ডিপ্লয় ━━━${NC}"

# চেক: supabase CLI আছে কিনা
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}⚠️  Supabase CLI ইনস্টল নেই — Edge Functions স্কিপ করা হচ্ছে${NC}"
  echo "   ইনস্টল: npm install -g supabase"
  SKIP_FUNCTIONS=true
else
  SKIP_FUNCTIONS=false
fi

if [ "$SKIP_FUNCTIONS" = false ]; then
  FUNCTIONS=(
    "auth-email-hook"
    "create-order"
    "check-fraud"
    "send-order-email"
    "book-redx-courier"
    "book-steadfast-courier"
    "book-pathao-courier"
    "courier-webhook"
    "track-courier"
    "fetch-areas"
  )

  FN_SUCCESS=0
  FN_FAILED=0
  FN_SKIPPED=0

  for fn in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$fn" ]; then
      if supabase functions deploy "$fn" --no-verify-jwt 2>/dev/null; then
        echo -e "  ${GREEN}✅ $fn${NC}"
        ((FN_SUCCESS++))
      else
        echo -e "  ${RED}❌ $fn${NC}"
        ((FN_FAILED++))
      fi
    else
      ((FN_SKIPPED++))
    fi
  done

  echo ""
  echo -e "  ফাংশন: ${GREEN}$FN_SUCCESS সফল${NC}, ${RED}$FN_FAILED ব্যর্থ${NC}, $FN_SKIPPED স্কিপ"
fi
echo ""

# ──────────────────────────────────
# ধাপ ৪: সারসংক্ষেপ
# ──────────────────────────────────
echo -e "${CYAN}━━━ ধাপ ৪/৪: সারসংক্ষেপ ━━━${NC}"
echo ""
echo -e "${GREEN}🎉 আপডেট সম্পন্ন!${NC}"
echo ""
echo "  📦 Frontend:  dist/ ফোল্ডার cPanel এ আপলোড করুন"
echo "  🔧 Backend:   Edge Functions ডিপ্লয় হয়ে গেছে"
echo ""
echo -e "${YELLOW}📌 cPanel আপলোড:${NC}"
echo "  dist/ ফোল্ডারের সব ফাইল → public_html/ এ রিপ্লেস করুন"
echo ""
echo -e "${CYAN}════════════════════════════════════════════${NC}"
