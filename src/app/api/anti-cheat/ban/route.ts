import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Lấy thông tin user hiện tại từ token của request
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Các Admin email được miễn trừ luật này
    const ADMIN_EMAILS = ['admin@luminastudy.site', 'nhuthangl24@gmail.com'];
    if (user.email && ADMIN_EMAILS.includes(user.email)) {
      console.log(`[Anti-Cheat] Admin ${user.email} triggered DevTools. Bypassing ban.`);
      return NextResponse.json({ success: true, bypassed: true });
    }

    // Thực hiện Ban user 100 năm (876000 giờ)
    const { data: updatedUser, error: banError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { ban_duration: '876000h' }
    );

    if (banError) {
      console.error('[Anti-Cheat] Lỗi khi ban user:', banError);
      return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 });
    }

    // Lấy IP để ghi log (tùy chọn)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Ghi log vào bảng user_bans
    await adminClient.from('user_bans').insert({
      user_id: user.id,
      reason: 'Sử dụng F12 / DevTools quá 60s',
      ip_address: ip,
      user_agent: userAgent
    });

    // Đăng xuất user trên server side (hủy token hiện tại)
    await supabase.auth.signOut();

    console.log(`[Anti-Cheat] BANNED user ${user.email || user.id} for DevTools abuse.`);

    return NextResponse.json({ success: true, message: 'User has been banned.' });
  } catch (err: any) {
    console.error('[Anti-Cheat] Exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
