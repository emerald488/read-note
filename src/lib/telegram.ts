import { Bot } from 'grammy'
import { randomBytes } from 'crypto'

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
  return randomBytes(4).toString('hex').toUpperCase().substring(0, 8)
}
