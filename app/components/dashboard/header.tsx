'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession, logout } from '@/lib/appwrite-client'
import { Button } from '@/components/ui/button'

export default function DashboardHeader() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function loadUser() {
      try {
        const session = await getCurrentSession()
        setUser(session)
      } catch (error) {
        console.error('Failed to load user:', error)
      }
    }
    loadUser()
  }, [])

  const handleSignOut = async () => {
    try {
      await logout()
      router.push('/auth/signin')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  if (!user) {
    return (
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold text-gray-900">
            Office 365 Management
          </h1>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">
            MTGPros Out of Office
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">
              {user.name || user.email}
            </p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            {(user.name || user.email).charAt(0).toUpperCase()}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
