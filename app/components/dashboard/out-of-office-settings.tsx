'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Simple form data structure
type OutOfOfficeForm = {
  startDate?: Date
  startTime?: string
  endDate?: Date
  endTime?: string
  message: string
  forwardEmails: boolean
  forwardTo?: string
}

// Mock users for the combobox
const mockUsers = [
  { value: 'john@company.com', label: 'John Smith (john@company.com)' },
  { value: 'jane@company.com', label: 'Jane Doe (jane@company.com)' },
  { value: 'bob@company.com', label: 'Bob Johnson (bob@company.com)' },
  { value: 'alice@company.com', label: 'Alice Williams (alice@company.com)' },
  { value: 'charlie@company.com', label: 'Charlie Brown (charlie@company.com)' },
]

export default function OutOfOfficeSettings() {
  const [loading, setLoading] = useState(false)
  const [showStartCalendar, setShowStartCalendar] = useState(false)
  const [showEndCalendar, setShowEndCalendar] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<OutOfOfficeForm>({
    defaultValues: {
      startDate: undefined,
      startTime: '09:00',
      endDate: undefined,
      endTime: '17:00',
      message: '',
      forwardEmails: false,
      forwardTo: '',
    },
  })

  const forwardEmails = watch('forwardEmails')
  const forwardTo = watch('forwardTo')

  // Map simple form data to backend API format
  async function onSubmit(data: OutOfOfficeForm) {
    setLoading(true)

    try {
      // Determine status based on dates
      let status: 'alwaysEnabled' | 'scheduled' | 'disabled' = 'disabled'
      let scheduledStartDateTime: string | undefined
      let scheduledEndDateTime: string | undefined

      if (data.startDate && data.endDate && data.startTime && data.endTime) {
        status = 'scheduled'
        
        // Combine date and time
        const [startHour, startMinute] = data.startTime.split(':')
        const startDateTime = new Date(data.startDate)
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0)
        
        const [endHour, endMinute] = data.endTime.split(':')
        const endDateTime = new Date(data.endDate)
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0)
        
        scheduledStartDateTime = startDateTime.toISOString()
        scheduledEndDateTime = endDateTime.toISOString()
      } else if (data.message) {
        status = 'alwaysEnabled'
      }

      // Wrap message in HTML tags
      const htmlMessage = data.message ? `<p>${data.message.replace(/\n/g, '</p><p>')}</p>` : ''

      // Build the technical API payload
      const apiPayload = {
        settings: {
          status,
          internalReplyMessage: htmlMessage,
          externalReplyMessage: htmlMessage,
          ...(status === 'scheduled' && {
            scheduledStartDateTime,
            scheduledEndDateTime,
          }),
        },
        mode: 'graph', // Default to graph mode
      }

      // Submit to API
      const res = await fetch('/api/oof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update settings')
      }

      // Handle email forwarding if enabled
      if (data.forwardEmails && data.forwardTo) {
        const forwardRes = await fetch('/api/forwarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            forwardingAddress: data.forwardTo,
            mode: 'graph',
          }),
        })

        if (!forwardRes.ok) {
          console.error('Failed to set up forwarding')
        }
      } else if (!data.forwardEmails) {
        // Clear forwarding if disabled
        await fetch('/api/forwarding', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'graph' }),
        })
      }

      alert('Out of Office settings updated successfully!')
    } catch (error: any) {
      console.error('Error updating settings:', error)
      alert(error.message || 'Failed to update settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Filter users based on search
  const filteredUsers = mockUsers.filter(user =>
    user.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedUser = mockUsers.find(u => u.value === forwardTo)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Out of Office
          </h1>
          <p className="text-gray-600">
            Set up automatic replies and email forwarding while you're away
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* When will you be away? */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                When will you be away?
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to turn on immediately without a schedule
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date & Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <Controller
                  name="startDate"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowStartCalendar(!showStartCalendar)}
                        className={cn(
                          "w-full flex items-center justify-start px-3 py-2 border rounded-md text-left bg-white hover:bg-gray-50 transition-colors",
                          field.value ? "text-gray-900" : "text-gray-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                      </button>
                      {showStartCalendar && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowStartCalendar(false)}
                          />
                          <div className="absolute z-20 mt-1 bg-white border rounded-md shadow-lg p-3">
                            <SimpleDatePicker
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date)
                                setShowStartCalendar(false)
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="time"
                        {...field}
                        className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                />
              </div>

              {/* End Date & Time */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  End Date
                </label>
                <Controller
                  name="endDate"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEndCalendar(!showEndCalendar)}
                        className={cn(
                          "w-full flex items-center justify-start px-3 py-2 border rounded-md text-left bg-white hover:bg-gray-50 transition-colors",
                          field.value ? "text-gray-900" : "text-gray-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                      </button>
                      {showEndCalendar && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setShowEndCalendar(false)}
                          />
                          <div className="absolute z-20 mt-1 bg-white border rounded-md shadow-lg p-3">
                            <SimpleDatePicker
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date)
                                setShowEndCalendar(false)
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  End Time
                </label>
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                      <input
                        type="time"
                        {...field}
                        className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          </div>

          {/* What should your message say? */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                What should your message say?
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                This message will be sent to anyone who emails you
              </p>
            </div>
            <Controller
              name="message"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  rows={5}
                  placeholder="Example: I'm currently out of the office and will return on Monday, December 15th. For urgent matters, please contact my colleague at colleague@company.com or call +1 (555) 123-4567."
                  className="w-full px-4 py-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                />
              )}
            />
            {errors.message && (
              <p className="text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>

          {/* Would you like to forward your emails? */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900">
                  Would you like to forward your emails?
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Forward incoming emails to a colleague while you're away
                </p>
              </div>
              <Controller
                name="forwardEmails"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={field.value}
                    onClick={() => field.onChange(!field.value)}
                    className={cn(
                      "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                      field.value ? "bg-blue-600" : "bg-gray-200"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        field.value ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                )}
              />
            </div>

            {/* Conditional: Who should we forward them to? */}
            {forwardEmails && (
              <div className="space-y-2 mt-4 pl-4 border-l-4 border-blue-200 bg-blue-50 p-4 rounded-r-md">
                <label className="text-sm font-medium text-gray-900">
                  Who should we forward them to?
                </label>
                <Controller
                  name="forwardTo"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <input
                        type="text"
                        value={showUserDropdown ? searchQuery : (selectedUser?.label || searchQuery)}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          setShowUserDropdown(true)
                        }}
                        onFocus={() => setShowUserDropdown(true)}
                        placeholder="Search for a colleague by name or email..."
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                      {showUserDropdown && searchQuery && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => {
                              setShowUserDropdown(false)
                              if (!field.value) {
                                setSearchQuery('')
                              }
                            }}
                          />
                          <div className="absolute z-20 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map((user) => (
                                <button
                                  key={user.value}
                                  type="button"
                                  onClick={() => {
                                    field.onChange(user.value)
                                    setSearchQuery(user.label)
                                    setShowUserDropdown(false)
                                  }}
                                  className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-2"
                                >
                                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm">
                                    {user.label.charAt(0)}
                                  </div>
                                  <span className="text-sm text-gray-900">{user.label}</span>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-gray-500 text-sm">
                                No users found matching "{searchQuery}"
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      {field.value && !showUserDropdown && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <div className="flex-shrink-0 h-6 w-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium text-xs">
                            ✓
                          </div>
                          <span>Forwarding to: <span className="font-medium text-gray-900">{selectedUser?.label}</span></span>
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange('')
                              setSearchQuery('')
                            }}
                            className="text-red-600 hover:text-red-700 text-xs underline ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Saving...
                </span>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Simple inline date picker component
function SimpleDatePicker({
  selected,
  onSelect,
}: {
  selected?: Date
  onSelect: (date: Date) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date())
  
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()
  
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i)
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  
  const previousMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentMonth(newDate)
  }
  
  const nextMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentMonth(newDate)
  }
  
  return (
    <div className="w-64 select-none">
      <div className="flex justify-between items-center mb-3 px-2">
        <button
          type="button"
          onClick={previousMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="font-semibold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 p-2">
            {day}
          </div>
        ))}
        {emptyDays.map(i => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(day => {
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
          const isSelected = selected && 
            date.getDate() === selected.getDate() &&
            date.getMonth() === selected.getMonth() &&
            date.getFullYear() === selected.getFullYear()
          
          const isToday = new Date().toDateString() === date.toDateString()
          
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(date)}
              className={cn(
                "p-2 text-sm rounded hover:bg-gray-100 transition-colors",
                isSelected && "bg-blue-600 text-white hover:bg-blue-700",
                isToday && !isSelected && "border border-blue-300",
                !isSelected && "text-gray-900"
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
