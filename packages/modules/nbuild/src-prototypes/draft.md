# Usage Draft Lib V2

## 🧱 Example Project Layout

```tree
src/
 ├─ build-types.ts
 ├─ step.ts
 ├─ build.ts
 └─ my-build.ts
```

---

## 🪄 `my-build.ts` — Example Usage

```ts
import { Step, evaluateStep, createStepNamespace } from "./step"
import { Build } from "./build"

// --- 1️⃣ Define steps ---
const Compile = new Step({
 name: "compile",
 exec({ config, getHelpers }) {
  const helpers = getHelpers
  console.log(`🔧 Compiling ${config.entry}...`)
  helpers.run({ cmd: "tsc", args: ["-p", "."], stdout: console.log })
  return true
 },
})

const Bundle = new Step({
 name: "bundle",
 exec({ config, getHelpers }) {
  console.log(`📦 Bundling output...`)
  getHelpers.run({
   cmd: "echo",
   args: ["Bundling complete for", config.target],
   stdout: console.log,
  })
  return true
 },
})

const Watch = new Step({
 name: "watch",
 exec({ config, getHelpers }) {
  console.log(`👀 Starting watch mode...`)
  // Demonstrate execStep usage — running nested steps
  getHelpers.execStep([
   helpers => {
    console.log("Running pre-watch setup...")
    return true
   },
   helpers => {
    console.log("Now watching for changes in:", config.watchDir)
    return true
   },
  ])
  return true
 },
})

// --- 2️⃣ Create namespace (so we can call them easily) ---
const Steps = createStepNamespace({ steps: [Compile, Bundle, Watch] })

// --- 3️⃣ Evaluate steps with user config ---
const compileStep = Steps.compile({ entry: "src/index.ts" })
const bundleStep = Steps.bundle({ target: "dist/" })
const watchStep = Steps.watch({ watchDir: "src/" })

// --- 4️⃣ Create and run the build ---
const build = new Build({
 params: {
  name: "example-build",
  dirname: process.cwd(),
  packageManager: "pnpm",
 },
 steps: [compileStep, bundleStep, watchStep],
})

// Run!
build.run()
```

---

## 🧩 Output Example

```terminal
🧱 Running build: example-build
→ Executing step...
🔧 Compiling src/index.ts...
tsc -p .
→ Executing step...
📦 Bundling output...
Bundling complete for dist/
→ Executing step...
👀 Starting watch mode...
Running pre-watch setup...
Now watching for changes in: src/
✅ Build complete.
```

---

## 💡 What This Draft Demonstrates

* **`Step`** is a reusable definition unit (with type-safe config).
* **`evaluateStep()`** produces a function waiting for build helpers.
* **`Build`** controls orchestration and injects helpers automatically.
* **`execStep()`** allows one step to call other steps — useful for things like:

  * pre/post build hooks
  * concurrent watchers
  * multi-target compilation
