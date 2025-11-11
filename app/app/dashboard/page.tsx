import { getCurrentUser } from '@/lib/auth'
import { getAuditLogs } from '@/lib/appwrite'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    return null
  }
  
  const recentLogs = await getAuditLogs(user.userId, 10)
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.displayName}!</h2>
        <p className="mt-2 text-gray-600">
          Manage your Out of Office settings and email forwarding rules from this dashboard.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/dashboard/oof">
          <div className="cursor-pointer rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="text-lg font-semibold text-gray-900">Out of Office</h3>
            <p className="mt-2 text-sm text-gray-600">
              Set automatic replies for when you're away from the office
            </p>
          </div>
        </Link>
        
        <Link href="/dashboard/forwarding">
          <div className="cursor-pointer rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="text-lg font-semibold text-gray-900">Email Forwarding</h3>
            <p className="mt-2 text-sm text-gray-600">
              Create rules to forward all incoming emails to another address
            </p>
          </div>
        </Link>
      </div>
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="mt-4 space-y-3">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-gray-500">No recent activity</p>
          ) : (
            recentLogs.map((log, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.action}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleString()} • Mode: {log.mode}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  log.status === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {log.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
