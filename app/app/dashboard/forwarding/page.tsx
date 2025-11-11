'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { forwardingRuleSchema, type ForwardingRule } from '@/lib/validators'
import { Button } from '@/components/ui/button'

export default function ForwardingPage() {
  const [loading, setLoading] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<any>(null)
  const [mode, setMode] = useState<'graph' | 'n8n'>('graph')
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(forwardingRuleSchema),
    defaultValues: {
      forwardTo: '',
      keepCopy: true,
      enabled: true,
    },
  })
  
  useEffect(() => {
    loadCurrentStatus()
  }, [])
  
  async function loadCurrentStatus() {
    try {
      const res = await fetch('/api/forwarding')
      if (res.ok) {
        const data = await res.json()
        setCurrentStatus(data.data)
      }
    } catch (error) {
      console.error('Failed to load current status:', error)
    }
  }
  
  async function onSubmit(data: ForwardingRule) {
    setLoading(true)
    
    try {
      const res = await fetch('/api/forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rule: data, mode }),
      })
      
      const result = await res.json()
      
      if (result.success) {
        alert('Forwarding rule created successfully!')
        await loadCurrentStatus()
        reset()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Failed to create forwarding rule')
    } finally {
      setLoading(false)
    }
  }
  
  async function deleteRule(forwardTo: string) {
    if (!confirm('Are you sure you want to delete this forwarding rule?')) {
      return
    }
    
    setLoading(true)
    
    try {
      const res = await fetch(`/api/forwarding?forwardTo=${encodeURIComponent(forwardTo)}&mode=${mode}`, {
        method: 'DELETE',
      })
      
      const result = await res.json()
      
      if (result.success) {
        alert('Forwarding rule deleted successfully!')
        await loadCurrentStatus()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Failed to delete forwarding rule')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Email Forwarding</h2>
        <p className="mt-2 text-sm text-gray-600">
          Create a rule to forward all incoming emails to another address
        </p>
      </div>
      
      {currentStatus?.hasRule && (
        <div className="rounded-lg border bg-yellow-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-yellow-900">Active Forwarding Rule</h3>
              <p className="mt-1 text-sm text-yellow-800">
                Forwarding to: <span className="font-medium">{currentStatus.forwardTo}</span>
                {currentStatus.keepCopy && ' (keeping a copy in inbox)'}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteRule(currentStatus.forwardTo)}
              disabled={loading}
            >
              Delete Rule
            </Button>
          </div>
        </div>
      )}
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Create Forwarding Rule</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Execution Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'graph' | 'n8n')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="graph">Direct (Microsoft Graph)</option>
              <option value="n8n">n8n Webhook</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Forward To Email Address
            </label>
            <input
              type="email"
              {...register('forwardTo')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="assistant@example.com"
            />
            {errors.forwardTo && (
              <p className="mt-1 text-sm text-red-600">{errors.forwardTo.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Note: External forwarding may be restricted by policy
            </p>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('keepCopy')}
              className="h-4 w-4 rounded border-gray-300 text-primary"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Keep a copy of forwarded messages in my inbox
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('enabled')}
              className="h-4 w-4 rounded border-gray-300 text-primary"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Enable rule immediately
            </label>
          </div>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => loadCurrentStatus()}
              disabled={loading}
            >
              Refresh Status
            </Button>
            
            <Button type="submit" disabled={loading || currentStatus?.hasRule}>
              {loading ? 'Creating...' : 'Create Forwarding Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
