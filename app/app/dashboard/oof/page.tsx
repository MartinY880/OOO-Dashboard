'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { oofSettingsSchema, type OofSettings } from '@/lib/validators'
import { Button } from '@/components/ui/button'

export default function OofPage() {
  const [loading, setLoading] = useState(false)
  const [currentSettings, setCurrentSettings] = useState<any>(null)
  const [mode, setMode] = useState<'graph' | 'n8n'>('graph')
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(oofSettingsSchema),
    defaultValues: {
      status: 'disabled',
      internalReplyMessage: '',
      externalReplyMessage: '',
    },
  })
  
  const status = watch('status')
  
  useEffect(() => {
    loadCurrentSettings()
  }, [])
  
  async function loadCurrentSettings() {
    try {
      const res = await fetch('/api/oof')
      if (res.ok) {
        const data = await res.json()
        setCurrentSettings(data.data)
      }
    } catch (error) {
      console.error('Failed to load current settings:', error)
    }
  }
  
  async function onSubmit(data: OofSettings) {
    setLoading(true)
    
    try {
      const res = await fetch('/api/oof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: data, mode }),
      })
      
      const result = await res.json()
      
      if (result.success) {
        alert('OOF settings updated successfully!')
        await loadCurrentSettings()
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      alert('Failed to update OOF settings')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Out of Office</h2>
        <p className="mt-2 text-sm text-gray-600">
          Set automatic replies when you're away from the office
        </p>
      </div>
      
      {currentSettings && (
        <div className="rounded-lg border bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900">Current Status</h3>
          <p className="mt-1 text-sm text-blue-800">
            Status: <span className="font-medium">{currentSettings.status}</span>
          </p>
        </div>
      )}
      
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              Status
            </label>
            <select
              {...register('status')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="disabled">Disabled</option>
              <option value="alwaysEnabled">Always Enabled</option>
              <option value="scheduled">Scheduled</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Internal Reply Message (HTML)
            </label>
            <textarea
              {...register('internalReplyMessage')}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="<p>I'm out of the office...</p>"
            />
            {errors.internalReplyMessage && (
              <p className="mt-1 text-sm text-red-600">{errors.internalReplyMessage.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              External Reply Message (HTML)
            </label>
            <textarea
              {...register('externalReplyMessage')}
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="<p>I'm out of the office...</p>"
            />
            {errors.externalReplyMessage && (
              <p className="mt-1 text-sm text-red-600">{errors.externalReplyMessage.message}</p>
            )}
          </div>
          
          {status === 'scheduled' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Start Date/Time
                  </label>
                  <input
                    type="datetime-local"
                    {...register('scheduledStartDateTime.dateTime')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    End Date/Time
                  </label>
                  <input
                    type="datetime-local"
                    {...register('scheduledEndDateTime.dateTime')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Time Zone
                </label>
                <select
                  {...register('scheduledStartDateTime.timeZone')}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                >
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </>
          )}
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => loadCurrentSettings()}
              disabled={loading}
            >
              Refresh Status
            </Button>
            
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
