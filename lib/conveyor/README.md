# Conveyor System

A type-safe IPC communication system for Electron applications that provides end-to-end type safety between renderer and main processes.

## Overview

The Conveyor system consists of four main components:

- **APIs**: Type-safe client interfaces for the renderer process
- **Handlers**: Server-side implementations in the main process
- **Schemas**: Zod-based validation and type definitions
- **Global Types**: Type declarations for global window access

<br />

## How to Use Existing Definitions

### In Renderer Process

```typescript
// Access the conveyor APIs through the global window object
const appVersion = await window.conveyor.app.version()
const windowInfo = await window.conveyor.window.windowInit()

// Window operations
await window.conveyor.window.windowMinimize()
await window.conveyor.window.windowMaximize()
await window.conveyor.window.windowClose()

// Web content operations
await window.conveyor.window.webCopy()
await window.conveyor.window.webPaste()
await window.conveyor.window.webOpenUrl('https://example.com')
```

### In React Components

```typescript
import { useConveyor } from '@/app/hooks/use-conveyor'

// Use specific API (recommended for components)
const appApi = useConveyor('app')
const windowApi = useConveyor('window')

// Or use all APIs
const conveyor = useConveyor()

// Examples with specific APIs
const appVersion = await appApi.version()
const windowInfo = await windowApi.windowInit()

// Window operations
await windowApi.windowMinimize()
await windowApi.windowMaximize()
await windowApi.windowClose()

// Web content operations
await windowApi.webCopy()
await windowApi.webPaste()
await windowApi.webOpenUrl('https://example.com')
```

### In Main Process

Handlers are registered by importing their registrar modules in the main process. Each handler module exports a registration function that sets up the IPC listeners with sender checks and runtime validation (see [Security](#security)).

```typescript
// lib/main/main.ts
import { registerLogsHandlers } from '@/lib/conveyor/handlers/logs-handler'

// In initializeApplication()
registerLogsHandlers()
```

<br />

## How to Add New IPC Channel

To add a new IPC channel, follow these steps in order:

### 1. Define the Schema

Create a schema file in `lib/conveyor/schemas/`:

```typescript
// lib/conveyor/schemas/notes-schema.ts
import { z } from 'zod'

export const notesIpcSchema = {
  'notes-get': {
    args: z.tuple([]),
    return: z.string(),
  },
  'notes-save': {
    args: z.tuple([z.string().max(100_000)]),
    return: z.void(),
  },
}
```

**Schema Purpose:**

- **`args`**: Defines the expected arguments that will be passed from the renderer to the main process. These are validated at runtime using Zod.
- **`return`**: Defines the expected return type from the main process back to the renderer. This ensures type safety and runtime validation of the response.

### 2. Add to the main schemas export

```typescript
// lib/conveyor/schemas/index.ts
import { notesIpcSchema } from './notes-schema'

export const ipcSchemas = {
  ...windowIpcSchema,
  ...appIpcSchema,
  ...notesIpcSchema, // Add your new schema
} as const
```

### 3. Create the API class

Create a new API class in `lib/conveyor/api/`. Declare each method as an arrow-function field that calls `this.invoke(...)` (or `this.subscribe(...)` for main-to-renderer events):

```typescript
// lib/conveyor/api/notes-api.ts
import { ConveyorApi } from '@/lib/preload/shared'

export class NotesApi extends ConveyorApi {
  get = () => this.invoke('notes-get')
  save = (content: string) => this.invoke('notes-save', content)
}
```

`invoke` and `subscribe` are protected prototype methods and the underlying `ipcRenderer` is a JS private field, so neither reaches the page. Only the arrow-function fields do.

### 4. Add to the main conveyor export

```typescript
// lib/conveyor/api/index.ts
import { NotesApi } from './notes-api'

export const conveyor = Object.freeze({
  app: toBridgeObject(new AppApi(electronAPI)),
  window: toBridgeObject(new WindowApi(electronAPI)),
  notes: toBridgeObject(new NotesApi(electronAPI)), // Add your new API
})

export type ConveyorApi = typeof conveyor
```

Always wrap the instance in `toBridgeObject`: it copies the domain's methods onto a plain frozen object, which is what crosses the contextBridge. Then add the new domain and its method names to `ALLOWED_METHODS` in `lib/preload/preload.test.ts`; the test fails on any method that is not allow-listed.

The `ConveyorApi` type is automatically derived from the conveyor object structure, ensuring type safety and eliminating the need for manual type maintenance.

### 5. Create the handler

Create a handler file in `lib/conveyor/handlers/`. The handler's first parameter is always the `IpcMainInvokeEvent`; the validated channel arguments follow it:

```typescript
// lib/conveyor/handlers/notes-handler.ts
import { handle, getRequestingWindow } from '@/lib/main/shared'
import type { NotesStore } from '@/lib/main/notes-store'

export const registerNotesHandlers = (store: NotesStore) => {
  handle('notes-get', () => store.get())

  handle('notes-save', (event, content) => {
    store.save(content)
    // `event` identifies the sending window when a handler needs it.
    getRequestingWindow(event).setTitle('Notes — saved')
  })
}
```

Never pass a renderer-supplied path, URL or command straight to the filesystem, a shell or the network. Accept an identifier the main process already knows (see how `file-open-path` only opens entries on the recent files list) or let the user pick through a native dialog.

### 6. Register handlers in main process

```typescript
// lib/main/main.ts
import { registerNotesHandlers } from '@/lib/conveyor/handlers/notes-handler'

// In initializeApplication()
registerNotesHandlers(notesStore)
```

**Note**: Global types are automatically updated when you add new APIs to the conveyor export, so no manual updates are needed!

## Type Safety Features

- **Compile-time validation**: TypeScript ensures correct method calls
- **Runtime validation**: Zod schemas validate arguments and return values
- **Auto-completion**: Full IntelliSense support in your IDE
- **Automatic type inference**: Types are derived from schemas automatically

## Preload Integration

Windows run with `contextIsolation` and `sandbox` enabled, so the preload only ever exposes the conveyor through the contextBridge:

```typescript
// lib/preload/preload.ts
import { contextBridge } from 'electron'
import { conveyor } from '@/lib/conveyor/api'

try {
  contextBridge.exposeInMainWorld('conveyor', conveyor)
} catch (error) {
  console.error(error)
}
```

In the page, each domain object holds only its own methods, for example `Object.keys(window.conveyor.logs)` is `['getPath', 'openFolder']`. There is no `renderer`, `invoke`, `subscribe`, `send` or `on`, and nothing that accepts an arbitrary channel name.

## Security

### Sender validation

`handle()` checks the sender of every request before it parses the arguments. A request is accepted only when `event.senderFrame` is the main frame of a window the app created and registered with `trustWindow()` (`lib/main/ipc-sender.ts`). Requests from iframes, from a window that is closing or destroyed, or from any other webContents are rejected with a `FORBIDDEN_IPC_SENDER` error, and the handler is never called. This applies to every channel, including the dev-only ones.

`createAppWindow` registers the main window. If you add another window, register it right after creating it and before it loads content:

```typescript
import { trustWindow } from '@/lib/main/ipc-sender'

const settingsWindow = trustWindow(
  new BrowserWindow({ webPreferences: { preload, sandbox: true, contextIsolation: true } })
)
```

The registration is dropped automatically when the window closes. Every trusted window can call every channel; if a channel must be limited to one window, check that inside the handler, for example by comparing `getRequestingWindow(event)` with the window it belongs to.

Inside a handler, `getRequestingWindow(event)` returns the trusted window that sent the request.

## Best Practices

1. **Naming Convention**: Use kebab-case for channel names (e.g., `file-read`, `window-minimize`)
2. **Schema Validation**: Always define Zod schemas for both arguments and return values
3. **Error Handling**: The system automatically logs errors, but you can add custom error handling in handlers
4. **Least Privilege**: Expose narrow, task-specific methods; never a method that forwards an arbitrary channel, path or command from the renderer
5. **Type Safety**: Leverage TypeScript's type inference - don't use `any` types
6. **Modular Design**: Keep related functionality in separate api/handler/schema files
7. **Consistent Structure**: Follow the existing pattern of api/handler/schema files for new features
