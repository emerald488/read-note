'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, FileText, Brain, Trophy, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
  { href: '/books', label: 'Книги', icon: BookOpen },
  { href: '/notes', label: 'Заметки', icon: FileText },
  { href: '/review', label: 'Повтор', icon: Brain },
  { href: '/achievements', label: 'Медали', icon: Trophy },
  { href: '/settings', label: 'Ещё', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground active:scale-95'
              )}
            >
              {isActive && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
              )}
              <item.icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_6px_var(--primary)]')} />
              <span className={cn(isActive && 'font-medium')}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
