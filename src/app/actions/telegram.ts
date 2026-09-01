"use server";

import { checkAdmin } from "./admin";
import { sendSystemNotification } from "@/lib/telegram/telegram";

export async function testTelegramAction(message: string): Promise<{ success: boolean; error?: string }> {
  if (!(await checkAdmin())) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // We send directly using the fireAndForget method, but we want to know if it succeeds for testing.
    // Wait, fireAndForget doesn't return success state. We can use `sendTelegram` directly for testing
    // to give immediate feedback to the admin.
    const { sendTelegram, escapeMD } = await import("@/lib/telegram/telegram");
    
    const formattedMessage = `🤖 *TEST NOTIFICATION*\n\n${escapeMD(message)}\n🕒 *Time*: ${escapeMD(new Date().toLocaleString('vi-VN'))}`;
    
    // We await this to return the actual result to the UI
    const result = await sendTelegram(formattedMessage, 1); // 1 attempt for testing
    
    if (result.success) {
      return { success: true };
    } else {
      return { success: false, error: result.error || "Failed to send message" };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
