export type NotificationType = 
  | 'payment_success' 
  | 'new_order'
  | 'new_user'
  | 'system'
  | 'error'
  | 'daily_report';

interface TelegramPayload {
  chat_id: string;
  text: string;
  parse_mode?: 'MarkdownV2' | 'HTML';
  disable_web_page_preview?: boolean;
  reply_markup?: any;
}

/**
 * Escapes characters for Telegram MarkdownV2
 * _ * [ ] ( ) ~ ` > # + - = | { } . !
 */
export const escapeMD = (text: string | null | undefined): string => {
  if (!text) return '';
  return String(text).replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
};

/**
 * Core function to send Telegram messages with retry logic
 */
export async function sendTelegram(text: string, maxRetries = 3, replyMarkup?: any): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("Telegram: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in env.");
    return { success: false, error: "Missing config" };
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload: TelegramPayload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'MarkdownV2',
    disable_web_page_preview: true
  };
  
  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000) 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Telegram API Error (${response.status}): ${JSON.stringify(errorData)}`);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error(`Telegram attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }
      // Exponential backoff: 1s, 2s, 4s
      const delayMs = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return { success: false, error: "Max retries exceeded" };
}

/**
 * Helper to dispatch Telegram messages without awaiting (Fire and forget)
 * so it doesn't slow down the main Response.
 */
export function fireAndForgetTelegram(text: string, replyMarkup?: any) {
  sendTelegram(text, 3, replyMarkup).catch(e => {
    console.error("Telegram fire-and-forget failed silently:", e);
  });
}

/**
 * Send Payment Notification (New Order or Approved)
 */
export function sendPaymentNotification(orderData: any, user: any, type: 'new_order' | 'approved') {
  try {
    const isApproved = type === 'approved';
    const header = isApproved ? '✅ *PAYMENT APPROVED*' : '🆕 *NEW ORDER CREATED*';
    const icon = isApproved ? '💰' : '📝';
    
    // Fallbacks if data is missing
    const fullName = user?.user_metadata?.full_name || 'N/A';
    const email = user?.email || 'N/A';
    const userId = user?.id || 'N/A';
    const planName = orderData?.plan_id?.toUpperCase() || 'UNKNOWN';
    const amount = (orderData?.amount || 0).toLocaleString('vi-VN');
    const discount = (orderData?.discount_amount || 0).toLocaleString('vi-VN');
    const orderId = orderData?.id || 'N/A';
    const transferCode = orderData?.transfer_content || 'N/A';
    const bank = orderData?.bank_code || 'N/A';
    const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

    let message = `${icon} ${header}\n`;
    message += `━━━━━━━━━━━━━━\n`;
    message += `👤 *User*: ${escapeMD(fullName)}\n`;
    message += `📧 *Email*: ${escapeMD(email)}\n`;
    message += `🆔 *User ID*: \`${escapeMD(userId)}\`\n`;
    message += `━━━━━━━━━━━━━━\n`;
    message += `📦 *Plan*: ${escapeMD(planName)}\n`;
    message += `💵 *Amount*: ${escapeMD(amount)} VNĐ\n`;
    
    if (orderData?.discount_amount > 0) {
      message += `📉 *Discount*: \\- ${escapeMD(discount)} VNĐ\n`;
    }
    
    message += `💳 *Method*: Bank Transfer \\(${escapeMD(bank)}\\)\n`;
    message += `🧾 *Transfer Code*: \`${escapeMD(transferCode)}\`\n`;
    message += `🔖 *Order ID*: \`${escapeMD(orderId)}\`\n`;
    message += `━━━━━━━━━━━━━━\n`;
    message += `🕒 *Time*: ${escapeMD(time)}\n`;
    
    let replyMarkup = undefined;

    if (isApproved) {
      message += `━━━━━━━━━━━━━━\n`;
      message += `✅ *Status*: Upgraded Successfully\n`;
    } else {
      message += `━━━━━━━━━━━━━━\n`;
      message += `⏳ *Status*: Waiting for Payment\n`;
      
      // Thêm nút duyệt/hủy cho đơn hàng mới
      replyMarkup = {
        inline_keyboard: [
          [
            { text: '✅ Duyệt', callback_data: `approve_${orderId}` },
            { text: '❌ Hủy', callback_data: `reject_${orderId}` }
          ]
        ]
      };
    }

    fireAndForgetTelegram(message, replyMarkup);
  } catch (error) {
    console.error("Failed to construct Telegram message:", error);
  }
}

/**
 * Edit an existing Telegram message
 */
export async function editTelegramMessageText(messageId: number, text: string, replyMarkup?: any): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return { success: false, error: "Missing config" };
  }

  const url = `https://api.telegram.org/bot${botToken}/editMessageText`;
  const payload: any = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: 'MarkdownV2',
    disable_web_page_preview: true
  };
  
  if (replyMarkup !== undefined) {
    payload.reply_markup = replyMarkup; // Can be null to remove buttons
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Telegram API Error: ${JSON.stringify(errorData)}`);
    }
    return { success: true };
  } catch (error: any) {
    console.error("Failed to edit Telegram message:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Answer a callback query to remove the loading state on the button
 */
export async function answerTelegramCallbackQuery(callbackQueryId: string, text?: string, showAlert?: boolean): Promise<{ success: boolean }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return { success: false };

  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
  const payload: any = {
    callback_query_id: callbackQueryId,
  };
  
  if (text) {
    payload.text = text;
    payload.show_alert = showAlert || false;
  }

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000)
    });
    return { success: true };
  } catch (error: any) {
    return { success: false };
  }
}

// ----------------------------------------------------------------------------
// BONUS FUNCTIONS
// ----------------------------------------------------------------------------

export function sendNewUserNotification(email: string, fullName: string) {
  const message = `🎉 *NEW USER REGISTERED*\n\n👤 *Name*: ${escapeMD(fullName)}\n📧 *Email*: ${escapeMD(email)}\n🕒 *Time*: ${escapeMD(new Date().toLocaleString('vi-VN'))}`;
  fireAndForgetTelegram(message);
}

export function sendSystemNotification(title: string, message: string) {
  const msg = `ℹ️ *SYSTEM NOTIFICATION*\n\n*${escapeMD(title)}*\n${escapeMD(message)}`;
  fireAndForgetTelegram(msg);
}

export function sendErrorNotification(errorMsg: string, context?: string) {
  const msg = `🚨 *SYSTEM ERROR*\n\n*Context*: ${escapeMD(context || 'Unknown')}\n*Error*: \`${escapeMD(errorMsg)}\`\n🕒 *Time*: ${escapeMD(new Date().toLocaleString('vi-VN'))}`;
  fireAndForgetTelegram(msg);
}
