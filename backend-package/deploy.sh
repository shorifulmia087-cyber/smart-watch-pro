#!/bin/bash
# =============================================
# Edge Functions ডিপ্লয় স্ক্রিপ্ট
# ব্যবহার: chmod +x deploy.sh && ./deploy.sh
# ⚠️ আগে supabase login ও supabase link করুন
# =============================================

echo "🚀 Edge Functions ডিপ্লয় শুরু হচ্ছে..."
echo ""

# Functions ফোল্ডার কপি করুন (যদি আলাদা থাকে)
FUNCTIONS_DIR="./functions"

if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo "❌ functions/ ফোল্ডার পাওয়া যায়নি!"
  echo "   এই স্ক্রিপ্ট backend-package/ ফোল্ডার থেকে রান করুন।"
  exit 1
fi

# প্রতিটি ফাংশন ডিপ্লয়
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

SUCCESS=0
FAILED=0

for fn in "${FUNCTIONS[@]}"; do
  if [ -d "$FUNCTIONS_DIR/$fn" ]; then
    echo "📦 ডিপ্লয় করা হচ্ছে: $fn"
    supabase functions deploy "$fn" --no-verify-jwt
    if [ $? -eq 0 ]; then
      echo "   ✅ $fn সফল"
      ((SUCCESS++))
    else
      echo "   ❌ $fn ব্যর্থ"
      ((FAILED++))
    fi
  else
    echo "⚠️  স্কিপ: $fn (ফোল্ডার নেই)"
  fi
  echo ""
done

echo "════════════════════════════════════"
echo "📊 ফলাফল: $SUCCESS সফল, $FAILED ব্যর্থ"
echo "════════════════════════════════════"

if [ $FAILED -eq 0 ]; then
  echo ""
  echo "🎉 সব Edge Functions সফলভাবে ডিপ্লয় হয়েছে!"
  echo ""
  echo "পরবর্তী ধাপ:"
  echo "  1. supabase secrets set RESEND_API_KEY=re_xxxx"
  echo "  2. supabase secrets set FRAUD_CHECKER_API_KEY=your_key"
  echo "  3. টেস্ট অর্ডার দিয়ে যাচাই করুন"
fi
