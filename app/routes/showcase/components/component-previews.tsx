// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, Check, ChevronDown, Copy, Download, Loader2, MoreHorizontal, Search, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Avatar } from '@/app/components/ui/avatar'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/app/components/ui/command'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/app/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/app/components/ui/form'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select'
import { toast } from '@/app/components/ui/sonner'
import { Switch } from '@/app/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs'
import { OfflineBanner } from '@/app/components/layout/OfflineBanner'
import { RouteFallback } from '@/app/components/layout/RouteFallback'
import { SectionShell, SettingRow } from '@/app/routes/settings/sections/SectionShell'

const FieldLabel = ({ children }: { children: string }) => (
  <p className="text-xs font-medium text-muted-foreground">{children}</p>
)

export const ButtonPreview = () => (
  <div className="space-y-4">
    <div className="flex flex-wrap gap-2">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">
        <Trash2 className="size-4" aria-hidden />
        Delete
      </Button>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Copy">
        <Copy className="size-4" aria-hidden />
      </Button>
      <Button disabled>
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading
      </Button>
    </div>
  </div>
)

export const BadgePreview = () => (
  <div className="flex flex-wrap gap-2">
    <Badge>Default</Badge>
    <Badge variant="secondary">Secondary</Badge>
    <Badge variant="outline">Outline</Badge>
    <Badge variant="destructive">Destructive</Badge>
    <Badge variant="ghost">Ghost</Badge>
  </div>
)

export const InputPreview = () => (
  <div className="grid gap-3 sm:grid-cols-2">
    <div className="space-y-2">
      <Label htmlFor="component-input-email">Email</Label>
      <Input id="component-input-email" placeholder="you@example.com" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="component-input-invalid">Invalid state</Label>
      <Input id="component-input-invalid" defaultValue="not-an-email" aria-invalid />
      <p className="text-xs text-destructive">Enter a valid email address.</p>
    </div>
    <div className="space-y-2">
      <Label htmlFor="component-input-disabled">Disabled</Label>
      <Input id="component-input-disabled" placeholder="Locked value" disabled />
    </div>
  </div>
)

export const SelectPreview = () => (
  <div className="flex flex-wrap gap-3">
    <Select defaultValue="latest">
      <SelectTrigger className="w-48" aria-label="Release channel">
        <SelectValue placeholder="Channel" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="latest">Stable</SelectItem>
        <SelectItem value="beta">Beta</SelectItem>
        <SelectItem value="nightly">Nightly</SelectItem>
      </SelectContent>
    </Select>
    <Select disabled>
      <SelectTrigger className="w-48" aria-label="Disabled select">
        <SelectValue placeholder="Unavailable" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="off">Unavailable</SelectItem>
      </SelectContent>
    </Select>
  </div>
)

export const SwitchPreview = () => (
  <div className="grid gap-3 sm:grid-cols-2">
    <label className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
      <span className="text-sm font-medium">Notifications</span>
      <Switch defaultChecked aria-label="Notifications" />
    </label>
    <label className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
      <span className="text-sm font-medium">Disabled</span>
      <Switch disabled aria-label="Disabled switch" />
    </label>
  </div>
)

export const TabsPreview = () => (
  <Tabs defaultValue="overview" className="max-w-xl">
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="settings">Settings</TabsTrigger>
      <TabsTrigger value="disabled" disabled>
        Disabled
      </TabsTrigger>
    </TabsList>
    <TabsContent value="overview" className="rounded-md border border-border p-3 text-sm text-muted-foreground">
      Compact tab panels for settings pages and dashboards.
    </TabsContent>
    <TabsContent value="settings" className="rounded-md border border-border p-3 text-sm text-muted-foreground">
      Panels stay mounted only when selected by the Radix primitive.
    </TabsContent>
  </Tabs>
)

export const DialogPreview = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button variant="outline">Open dialog</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Confirm export</DialogTitle>
        <DialogDescription>Dialog content is portaled, focus-trapped, and dismissible with Escape.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button>
            <Download className="size-4" aria-hidden />
            Export
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

export const DropdownMenuPreview = () => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">
        Actions
        <ChevronDown className="size-4" aria-hidden />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-52">
      <DropdownMenuLabel>File actions</DropdownMenuLabel>
      <DropdownMenuItem>
        Copy path
        <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuCheckboxItem checked>Show recent files</DropdownMenuCheckboxItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive">Remove from list</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

const profileSchema = z.object({
  displayName: z.string().min(2, 'Use at least 2 characters.'),
  email: z.string().email('Enter a valid email.'),
})

export const FormPreview = () => {
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: 'Ada Lovelace', email: 'ada@example.com' },
  })

  return (
    <Form {...form}>
      <form className="grid max-w-xl gap-4" onSubmit={form.handleSubmit(() => toast.success('Validated form'))}>
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>Shown in the window title and About page.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-fit">
          Validate
        </Button>
      </form>
    </Form>
  )
}

export const AvatarPreview = () => (
  <div className="flex items-center gap-3">
    <Avatar fallback="Ada Lovelace" className="size-10" />
    <Avatar fallback="Grace Hopper" className="size-12" />
    <Avatar className="size-10" />
    <div>
      <p className="text-sm font-medium">Fallbacks first</p>
      <p className="text-xs text-muted-foreground">Initials render when an image URL is absent or fails to load.</p>
    </div>
  </div>
)

export const ScrollAreaPreview = () => (
  <ScrollArea className="h-36 max-w-xl rounded-md border border-border">
    <div className="space-y-2 p-3">
      {Array.from({ length: 12 }, (_, index) => (
        <div key={index} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span>Log entry {index + 1}</span>
          <Badge variant="outline">info</Badge>
        </div>
      ))}
    </div>
  </ScrollArea>
)

export const SonnerPreview = () => (
  <div className="flex flex-wrap gap-2">
    <Button onClick={() => toast.success('Settings saved')}>Success toast</Button>
    <Button variant="outline" onClick={() => toast.error('Could not save settings')}>
      Error toast
    </Button>
  </div>
)

export const CommandPreview = () => (
  <Command className="max-w-xl rounded-lg border border-border">
    <CommandInput placeholder="Search commands..." />
    <CommandList>
      <CommandEmpty>No command found.</CommandEmpty>
      <CommandGroup heading="Navigation">
        <CommandItem>
          <Search className="size-4" aria-hidden />
          Open Showcase
          <CommandShortcut>⌘K</CommandShortcut>
        </CommandItem>
        <CommandItem>
          <Bell className="size-4" aria-hidden />
          Notification demo
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
)

export const OfflineBannerPreview = () => (
  <div className="overflow-hidden rounded-md border border-border">
    <OfflineBanner />
    <div className="flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/15 px-4 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
      Simulated offline banner preview
    </div>
    <div className="p-3 text-sm text-muted-foreground">The live component collapses when the OS reports online.</div>
  </div>
)

export const SectionShellPreview = () => (
  <SectionShell title="Storage" description="Where app data is stored on this device.">
    <SettingRow
      label="Data directory"
      description="Override the default location for app data."
      control={<Button variant="outline">Choose</Button>}
    />
  </SectionShell>
)

export const RouteFallbackPreview = () => (
  <div className="h-36 rounded-md border border-border">
    <RouteFallback />
  </div>
)

export const FeedbackStatesPreview = () => (
  <div className="grid gap-3 sm:grid-cols-3">
    <div className="rounded-md border border-border p-3">
      <FieldLabel>Loading</FieldLabel>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Fetching data
      </div>
    </div>
    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3">
      <FieldLabel>Success</FieldLabel>
      <div className="mt-2 flex items-center gap-2 text-sm">
        <Check className="size-4" aria-hidden />
        Saved
      </div>
    </div>
    <div className="rounded-md border border-border p-3">
      <FieldLabel>Menu affordance</FieldLabel>
      <Button size="icon" variant="ghost" className="mt-2" aria-label="More actions">
        <MoreHorizontal className="size-4" aria-hidden />
      </Button>
    </div>
  </div>
)
