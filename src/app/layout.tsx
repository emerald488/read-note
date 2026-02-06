import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Читательский Дневник',
  description: 'Мотивация для ежедневного чтения с геймификацией',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" className="dark">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
