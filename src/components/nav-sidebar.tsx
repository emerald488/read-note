'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, BookOpen, FileText, Brain, Trophy, Settings, LogOut, Palette } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

const navItems = [
  { href: '/dashboard', label: 'Главная', icon: LayoutDashboard },
  { href: '/books', label: 'Книги', icon: BookOpen },
  { href: '/notes', label: 'Заметки', icon: FileText },
  { href: '/review', label: 'Повторение', icon: Brain },
  { href: '/achievements', label: 'Достижения', icon: Trophy },
  { href: '/settings', label: 'Настройки', icon: Settings },
]

export function NavSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex w-64 border-r border-border bg-sidebar flex-col h-screen sticky top-0">
      <div className="p-6 pb-4">
        <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
          <span className="text-primary">Читательский</span> Дневник
        </h1>
        <p className="text-[11px] text-muted-foreground mt-0.5 tracking-widest uppercase">Читай каждый день</p>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isActive
                  ? 'nav-active bg-primary/10 text-primary shadow-sm shadow-primary/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <item.icon className={cn('h-5 w-5 transition-colors', isActive && 'text-primary')} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-border space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium text-muted-foreground">
          <Palette className="h-5 w-5" />
          <span>Тема</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Выйти из аккаунта"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
