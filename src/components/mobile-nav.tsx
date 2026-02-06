'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, FileText, Brain, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
  { href: '/books', label: 'Книги', icon: BookOpen },
  { href: '/notes', label: 'Заметки', icon: FileText },
  { href: '/review', label: 'Повтор', icon: Brain },
  { href: '/achievements', label: 'Медали', icon: Trophy },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
