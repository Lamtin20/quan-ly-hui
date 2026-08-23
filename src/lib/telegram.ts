import { prisma } from "./prisma"

export async function sendTelegramMessage(text: string) {
  try {
    const tokenSetting = await prisma.systemSetting.findUnique({ where: { key: "TELEGRAM_BOT_TOKEN" } })
    const chatSetting = await prisma.systemSetting.findUnique({ where: { key: "TELEGRAM_CHAT_ID" } })

    const token = tokenSetting?.value
    const chatId = chatSetting?.value

    if (!token || !chatId) {
      console.log("Telegram not configured")
      return
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML"
      })
    })

    if (!response.ok) {
      console.error("Failed to send telegram message", await response.text())
    }
  } catch (error) {
    console.error("Error sending telegram message:", error)
  }
}
