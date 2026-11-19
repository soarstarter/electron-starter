// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { useConveyor } from '@/app/hooks/use-conveyor'
import type { SecureKey } from '@/lib/conveyor/schemas'

const DEMO_KEY: SecureKey = 'demo-secret'

export const SecureStorageDemo = () => {
  const secure = useConveyor('secure')
  const [value, setValue] = useState('demo-secret')
  const [status, setStatus] = useState('No secure storage action has run yet.')

  const setSecret = async () => {
    const result = await secure.set(DEMO_KEY, value)
    setStatus(result.ok ? `Stored ${DEMO_KEY}.` : result.error.message)
  }

  const getSecret = async () => {
    const result = await secure.get(DEMO_KEY)
    setStatus(result.ok ? `Read value: ${result.value ?? '(empty)'}` : result.error.message)
  }

  const deleteSecret = async () => {
    const result = await secure.delete(DEMO_KEY)
    setStatus(result.ok ? `Deleted ${DEMO_KEY}.` : result.error.message)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <KeyRound className="size-4" aria-hidden />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Round-trip a secret</h2>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input value={value} onChange={(event) => setValue(event.target.value)} aria-label="Secret value" />
          <Button onClick={() => void setSecret()} disabled={!value.trim()}>
            Set
          </Button>
          <Button variant="outline" onClick={() => void getSecret()}>
            Get
          </Button>
          <Button variant="outline" onClick={() => void deleteSecret()}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
