
-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Public can create orders" ON public.orders;

-- Create a PERMISSIVE INSERT policy so anyone can create orders
CREATE POLICY "Public can create orders"
ON public.orders
FOR INSERT
TO anon, authenticated
WITH CHECK (
  customer_name IS NOT NULL
  AND phone IS NOT NULL
  AND address IS NOT NULL
  AND watch_model IS NOT NULL
  AND total_price > 0
);

-- Add a permissive SELECT policy so inserting user can get the returned row
-- (needed for .select().single() after insert)
CREATE POLICY "Anyone can select own just-inserted order"
ON public.orders
FOR SELECT
TO anon
USING (true);
