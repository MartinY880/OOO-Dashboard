import AuthCheck from '@/components/auth/auth-check'
import DashboardHeader from '@/components/dashboard/header'

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
          <main>
            {children}
          </main>
        </div>
      </div>
    </AuthCheck>
  )
}
