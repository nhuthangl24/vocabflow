import { NextResponse } from 'next/server';
import { approveOrderCore, rejectOrderCore } from '@/app/actions/payment';
import { editTelegramMessageText, answerTelegramCallbackQuery, escapeMD } from '@/lib/telegram/telegram';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Telegram sends callback_query when an inline button is pressed
    if (payload.callback_query) {
      const callbackQuery = payload.callback_query;
      const callbackQueryId = callbackQuery.id;
      const data = callbackQuery.data; // e.g., 'approve_123' or 'reject_123'
      const message = callbackQuery.message;
      const messageId = message?.message_id;
      const text = message?.text; // Original message text

      if (!data) {
        return NextResponse.json({ success: true });
      }

      const isApprove = data.startsWith('approve_');
      const isReject = data.startsWith('reject_');

      if (!isApprove && !isReject) {
        return NextResponse.json({ success: true });
      }

      const orderId = data.replace('approve_', '').replace('reject_', '');
      let actionResult: any;

      if (isApprove) {
        // Approve the order (passing null as actorId since it's via telegram bot)
        actionResult = await approveOrderCore(orderId, null);
      } else {
        // Reject the order
        actionResult = await rejectOrderCore(orderId, null, "Rejected via Telegram Admin");
      }

      if (actionResult?.success || actionResult?.error === 'Đơn hàng đã được duyệt.') {
        // Notify Telegram that the query was successful
        await answerTelegramCallbackQuery(callbackQueryId, isApprove ? '✅ Đã duyệt đơn hàng!' : '❌ Đã từ chối đơn hàng!');

        // Update the original message text to reflect the new status
        // We will append the result to the end of the original text and remove the inline keyboard
        // Need to escape markdown safely for telegram
        
        let newText = text ? escapeMD(text) : 'Order Processed';
        if (isApprove) {
           newText += '\n\n━━━━━━━━━━━━━━\n✅ *Status*: Approved via Telegram';
        } else {
           newText += '\n\n━━━━━━━━━━━━━━\n❌ *Status*: Rejected via Telegram';
        }
        
        // When editing message text, we need to pass the reply_markup as null or empty to remove buttons
        await editTelegramMessageText(messageId, newText, { inline_keyboard: [] }); 
      } else {
        // Notify Telegram that it failed
        await answerTelegramCallbackQuery(callbackQueryId, '⚠️ Thất bại: ' + (actionResult?.error || 'Lỗi không xác định'), true);
      }
    }

    // Always return 200 OK to Telegram so it doesn't retry
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram Webhook Error:', error);
    // Still return 200 so Telegram stops retrying
    return NextResponse.json({ success: true });
  }
}
