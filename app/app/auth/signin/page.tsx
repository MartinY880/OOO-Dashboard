'use client'

import { loginWithMicrosoft } from '@/lib/appwrite-client'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      await loginWithMicrosoft('/dashboard', '/auth/error')
    } catch (error) {
      console.error('Sign in failed:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Office 365 Management
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Microsoft account to manage your mailbox settings
          </p>
        </div>
        
        <div className="mt-8">
          <Button
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 23 23" fill="currentColor">
              <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z"/>
            </svg>
            {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
          </Button>
        </div>
        
        <p className="text-center text-xs text-gray-500">
          By signing in, you agree to allow this app to manage your Out of Office
          settings and email forwarding rules.
        </p>
      </div>
    </div>
  )
}
