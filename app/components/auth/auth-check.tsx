'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession } from '@/lib/appwrite-client'

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await getCurrentSession()
        
        if (!session) {
          router.push('/auth/signin')
          return
        }
        
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/auth/signin')
      }
    }

    checkAuth()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
