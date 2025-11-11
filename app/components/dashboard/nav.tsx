'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/oof', label: 'Out of Office' },
  { href: '/dashboard/forwarding', label: 'Email Forwarding' },
]

export default function DashboardNav() {
  const pathname = usePathname()
  
  return (
    <nav className="flex space-x-1 rounded-lg bg-white p-1 shadow">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
