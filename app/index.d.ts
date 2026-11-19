/// <reference types="electron-vite/node" />

interface ImportMetaEnv {
  readonly VITE_REPO_URL?: string
  // [template-demo] Safe to delete — see docs/CUSTOMIZE.md.
  readonly VITE_SHOWCASE_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.jpg' {
  const content: string
  export default content
}

declare module '*.jpeg' {
  const content: string
  export default content
}

declare module '*.svg' {
  const content: string
  export default content
}

declare module '*.web' {
  const content: string
  export default content
}
