// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { useConveyor } from '@/app/hooks/use-conveyor'
import type { NotifyResult } from '@/lib/conveyor/schemas'

const describeResult = (result: NotifyResult): string => {
  if (result.ok) return 'Notification sent.'
  if (result.reason === 'disabled') return 'Notifications are disabled in Settings.'
  return 'Notifications are not supported in this runtime.'
}

export const NotificationsDemo = () => {
  const notification = useConveyor('notification')
  const [status, setStatus] = useState('Ready to send a native notification.')

  const send = async () => {
    const result = await notification.notify({
      title: 'Showcase notification',
      body: 'This came through the typed Conveyor notification API.',
    })
    setStatus(describeResult(result))
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Bell className="size-4" aria-hidden />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Send a notification</h2>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        </div>
        <Button onClick={() => void send()}>Send notification</Button>
      </div>
    </div>
  )
}
