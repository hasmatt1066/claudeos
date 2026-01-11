# Phase 1: Scaffold

## Objective

Initialize an electron-vite project with TypeScript and create the directory structure defined in ARCHITECTURE.md.

## Acceptance Criteria

- [ ] electron-vite project initialized in the repo root
- [ ] TypeScript configured with strict mode
- [ ] Directory structure created:
  ```
  src/
  ├── main/
  │   └── index.ts
  ├── renderer/
  │   ├── index.html
  │   ├── index.tsx
  │   └── App.tsx
  ├── preload/
  │   └── index.ts
  ├── worker/
  │   └── (empty, placeholder)
  └── shared/
      └── types.ts
  ```
- [ ] package.json has scripts: dev, build, preview
- [ ] ESLint and Prettier configured
- [ ] .gitignore includes node_modules, dist, out
- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts without crashing (window may be empty/white)

## Technical Notes

- Use `npm create @anthropic-ai/claude-code@latest` is NOT correct
- Use `npm create electron-vite@latest` to scaffold
- Choose: TypeScript, React for renderer
- After scaffold, restructure to match our architecture
- Main process entry: src/main/index.ts
- Renderer entry: src/renderer/index.tsx

## Out of Scope

- Any actual UI implementation
- IPC setup
- Agent SDK integration
- These come in later phases

## Files to Create/Modify

- package.json
- tsconfig.json (and variants)
- electron.vite.config.ts
- src/main/index.ts
- src/renderer/*
- src/preload/index.ts
- .eslintrc.cjs
- .prettierrc
- .gitignore

## Completion

When all criteria are met and `npm run dev` opens an Electron window (even if blank), output:

```
<promise>COMPLETE</promise>
```
