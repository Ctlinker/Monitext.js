# @monitext/build-ts — Implementation Strategy

## Overview

This document outlines the technical implementation strategy for the new
`@monitext-devtools/bundler` system, based on the MVP specifications and current
`draft.ts` prototype. The goal is to replace the existing bundler with a more
flexible, performant, and maintainable system.

---

## Current State Analysis

### **Existing Implementation (`draft.ts`)**

The current draft shows a clear direction:

```typescript
Build({
    dir: __dirname,
    run: [
        B.pkg({ run: ["types"] }),
        B.exec({ cmds: [...] }),
        B.dts({ mode: "file", opts: {...} }),
        B.bundle({ mode: "file", opts: {...} }),
        B.custom((param) => {...})
    ]
});
```

**Strengths:**

- Clear separation of concerns with `B.*` namespace
- Pipeline-based execution model
- Support for custom steps
- Plugin architecture foundation with `B.new()`

**Areas for Implementation:**

- Core `Build` and `B` namespace functions
- Mode-based operations (`file` vs `dir`)
- Variant-based bundling system
- Plugin execution engine
- Error handling and recovery

---

## Technical Architecture

### **1. Type System Design**

```typescript
// Core types
interface BuildConfig {
    dir: string;
    run: BuildStep[];
    hooks?: BuildHooks;
    context?: BuildContext;
    parallel?: boolean;
}

interface BuildStep {
    type: "bundle" | "dts" | "exec" | "pkg" | "custom";
    name?: string;
    config: any; // Step-specific configuration
}

interface BuildContext {
    dirname: string;
    rootDir: string;
    packageJson: any;
    tsconfig: any;
    cache: CacheManager;
    logger: Logger;
}

// Operation-specific types
interface BundleConfig {
    mode: "file" | "dir";
    opts: {
        entry: string | string[];
        outfile?: string;
        outdir?: string;
        variants: BuildVariant[];
        tsconfig?: string;
    };
}

interface BuildVariant {
    name: string;
    formats: ("cjs" | "esm" | "iife")[];
    external: string[];
    bundle: boolean;
    minify: boolean;
    minifyIdentifiers?: boolean;
    minifySyntax?: boolean;
    minifyWhitespace?: boolean;
    treeShaking?: boolean;
}
```

## Implementation Phases

### **Phase 1: Core Foundation**

To be implementable, it's required to define `Build()`, `Plugin` and
`executePlugin()`, eg:

```ts
const C = B.new({
    plugins: [
        { // plugin contract, mockup
            name: "parallel",
            func(param: {
                execBuild: (p: any) => any;
                cfg: Record<string, any>;
                get: { dirname: any };
            }) {
                const targets = param.cfg.run.map(
                    (b: any) => new Promise(() => param.execBuild(b)),
                );
                return Promise.all(targets);
            },
        },
    ],
});

Build({
    dir: __dirname,
    run: C.parallel({
        run: [
            B.pkg({ run: ["test"] }),
            B.cmd("pnpm dlx tsx ./build-for-linux.ts"),
            B.cmd("pnpm dlx tsx ./build-for-win.ts"),
            B.cmd("pnpm dlx tsx ./build-for-mac.ts"),
        ],
    }),
});
```

Where `execBuild`, is the `executePlugin` fn and the `new()` creates an extended
`Build` object

### **Phase 2: Base Operations**

**Objectives:**

- Implement all B.* operations
- Add error handling and recovery
- Performance optimizations

**Deliverables:**

- Complete `B.dts()`, `B.cmd()`, `B.bundle()`, `B.exec()`, `B.pkg()`
  implementations
- Robust error handling system
- Basic caching mechanism

### **Phase 3: Advanced Operations**

**Objectives:**

- Implement some exec drift operations

**Deliverables:**

- Complete `B.watch()`, `B.parallel()` implementations

## Critical Decision Points (Claude AI suggestion)

### **Architecture Decision: Plugin System**

Your `B.new()` concept is interesting. Consider:

- Start with a simple function-based plugin system
- Evolve to more complex plugin architecture later
- Keep it focused on the immediate use cases

### **Performance Decision: Parallel Execution**

For the MVP:

- Execute steps sequentially for simplicity
- Add parallel execution within variants (safe to parallelize)
- Full parallel pipeline can come later

### **API Decision: Error Handling**

Consider these patterns from your draft:

- `B.catch()` - Wrap commands with error handling
- `B.ensure()` - Validation gates
- `B.optional()` - Non-critical steps

## Risk Mitigation (Claude AI suggestion)

### **Technical Risks**

- **esbuild integration complexity**: Start with basic config, iterate
- **TypeScript declaration generation**: Use existing tools (tsc, tsup)
  initially
- **Path resolution issues**: Test with real package structures early

### **Timeline Risks**

- **Scope creep**: Focus on making existing draft.ts work first
- **Perfect solution paralysis**: Get basic version working, then improve
- **Testing complexity**: Start with integration tests, add unit tests later

The key is to get a working version of your exact `draft.ts` use case within a
week, then iterate from there.
