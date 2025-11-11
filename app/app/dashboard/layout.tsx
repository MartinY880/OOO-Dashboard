import AuthCheck from '@/components/auth/auth-check'
import DashboardHeader from '@/components/dashboard/header'
import DashboardNav from '@/components/dashboard/nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthCheck>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8">
          <DashboardNav />
          <main className="mt-8">
            {children}
          </main>
        </div>
      </div>
    </AuthCheck>
  )
}
