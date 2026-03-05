

## Plan: Update Button Animation & Price Display

### Changes to `src/components/HeroSlider.tsx`:

1. **Button animation**: Change from flip (`rotateX`) to bounce/jump (`translateY`) animation. The button will jump up and down every 3 seconds using the existing `flipKey` interval.
   - `initial: { y: -20, opacity: 0 }` → `animate: { y: 0, opacity: 1 }` → `exit: { y: 20, opacity: 0 }`
   - Remove the `perspective` wrapper style

2. **Price display**: Change from single-line horizontal layout to two-line vertical layout:
   - Line 1: "মূল্য: ৳X,XXX" (original price, with line-through when discount exists)
   - Line 2: "অফার মূল্য: ৳X,XXX" (discounted price, shown only when discount > 0)
   - Keep the discount badge on the second line
   - Use `flex-col` instead of horizontal `flex` for the price section

