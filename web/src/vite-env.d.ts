/// <reference types="vite/client" />

// Tells TypeScript which VITE_* variables exist (Vite inlines them at build time).
interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
