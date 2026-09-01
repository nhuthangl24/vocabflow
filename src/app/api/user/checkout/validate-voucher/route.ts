import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { code, amount } = await request.json();
    if (!code) return NextResponse.json({ error: "Vui lòng nhập mã Voucher" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Vui lòng đăng nhập" }, { status: 401 });
    }

    // 1. Fetch voucher
    const { data: voucher, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', String(code).toUpperCase())
      .single();

    if (error || !voucher) {
      return NextResponse.json({ error: "Mã Voucher không tồn tại" }, { status: 400 });
    }

    // 2. Validate Status
    if (voucher.status !== 'active') {
      return NextResponse.json({ error: "Voucher đã bị vô hiệu hóa" }, { status: 400 });
    }

    // 3. Validate Dates
    const now = new Date();
    if (voucher.start_date && new Date(voucher.start_date) > now) {
      return NextResponse.json({ error: "Voucher chưa tới thời gian áp dụng" }, { status: 400 });
    }
    if (voucher.end_date && new Date(voucher.end_date) < now) {
      return NextResponse.json({ error: "Voucher đã hết hạn" }, { status: 400 });
    }

    // 4. Validate Min Order
    if (voucher.min_order && amount < voucher.min_order) {
      return NextResponse.json({ error: `Voucher này chỉ áp dụng cho đơn từ ${voucher.min_order.toLocaleString()}đ` }, { status: 400 });
    }

    // 5. Validate Usage Limit
    if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
      return NextResponse.json({ error: "Voucher đã hết lượt sử dụng" }, { status: 400 });
    }

    // 6. Validate per user limit
    const { count: userUsageCount } = await supabase
      .from('voucher_usage')
      .select('*', { count: 'exact', head: true })
      .eq('voucher_id', voucher.id)
      .eq('user_id', user.id);

    if (voucher.usage_per_user && (userUsageCount || 0) >= voucher.usage_per_user) {
      return NextResponse.json({ error: "Bạn đã hết lượt sử dụng mã này" }, { status: 400 });
    }

    // 7. Calculate Discount
    let discountAmount = 0;
    if (voucher.discount_type === 'percent') {
      discountAmount = (amount * voucher.discount_value) / 100;
      if (voucher.max_discount && discountAmount > voucher.max_discount) {
        discountAmount = voucher.max_discount;
      }
    } else {
      discountAmount = voucher.discount_value;
    }

    // Don't discount more than total amount
    if (discountAmount > amount) {
      discountAmount = amount;
    }

    return NextResponse.json({
      success: true,
      voucher_id: voucher.id,
      discount_amount: discountAmount,
      final_amount: amount - discountAmount
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
