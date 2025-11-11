import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import DashboardHeader from '@/components/dashboard/header'
import DashboardNav from '@/components/dashboard/nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/signin')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} />
      <div className="container mx-auto px-4 py-8">
        <DashboardNav />
        <main className="mt-8">
          {children}
        </main>
      </div>
    </div>
  )
}
