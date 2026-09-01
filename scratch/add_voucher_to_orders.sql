ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS voucher_id uuid REFERENCES public.vouchers(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount double precision DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS original_amount double precision DEFAULT 0;
