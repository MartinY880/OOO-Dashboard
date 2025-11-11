'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import type { UserProfile } from '@/lib/validators'

interface DashboardHeaderProps {
  user: UserProfile
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">
            Office 365 Management
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user.displayName}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
