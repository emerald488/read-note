import { Bot, Context } from 'grammy'

let bot: Bot | null = null

export function getBot(): Bot {
  if (!bot) {
    bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)
  }
  return bot
}

export async function sendTelegramMessage(chatId: number | string, text: string) {
  const b = getBot()
  await b.api.sendMessage(chatId, text, { parse_mode: 'HTML' })
}

export function generateLinkCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
