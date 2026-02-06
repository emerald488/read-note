import { NavSidebar } from '@/components/nav-sidebar'
import { MobileNav } from '@/components/mobile-nav'

export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <NavSidebar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="container max-w-4xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  )
}
