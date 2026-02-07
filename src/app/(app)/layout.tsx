import { NavSidebar } from '@/components/nav-sidebar'
import { MobileNav } from '@/components/mobile-nav'

export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <NavSidebar />
      <main className="flex-1 min-w-0 pb-20 md:pb-0 md:ml-64">
        <div className="max-w-4xl mx-auto px-4 py-4 md:px-8 md:py-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
