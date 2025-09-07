# 📂 Repository Layout

This document explains the general structure of the MoniText repository.

---

## Root

* **`package.json`** – Monorepo root config, shared scripts, and dependencies.
* **`pnpm-workspace.yaml`** – Workspace definition for PNPM monorepo management.
* **`LICENSE`** – Project license.
* **`repository/Layout.md`** – This file: overview of repo organization.

---

## Directories

### **`modules/`**

  Contains **standalone libraries** that implement specific features.

  > Think of these as "building blocks" — small, focused libs that may or may not be published on npm directly.

### **`packages/`**

Houses **publishable modules** (npm-scoped packages).
Each subdirectory is a self-contained package with its own build, tests, and metadata.

Example:

* **`packages/modules/color/`** – The color formatting & pseudo-language package.

  * `src/` – Source code (organized into `lang/` and `lib/`).
  * `test/` – Unit tests.
  * `build.ts` – Package build script.
  * `THIRD_PARTY_LICENSES` – Licensing for included dependencies.
  * `tsconfig.*.json` – TypeScript configs (base/build/target).

---

### **`devtools/`**

Contains **internal tools** used during development. These are not published to npm.

* **`modules/`** – Developer helper libraries.

  * `bundler/` – Custom bundler/minifier tools.
  * `paths/` – Path resolution utilities.
  * `tsconfig/` – Shared TypeScript config module.

* **`scripts/`** – Internal CLI utilities and scripts.

  * `src/commands/` – Individual script commands (e.g., `ts-dts-minify.ts`, `html-table-to-json.ts`).
  * `src/lib/` – Shared script infrastructure (command handling, command registry).
  * `src/main.ts` – Script entrypoint.

---

### **`repository/`**

Docs and metadata about the repo itself.

* `Layout.md` – This file, describing the structure and purpose of directories.

---

## Hierarchy Summary

```tree
repository/ (docs about repo itself)
 └─ Layout.md

packages/ (publishable libs, versioned on npm)
 └─ modules/
     └─ color/

devtools/ (internal tooling, not published)
 ├─ modules/ (helper libs)
 │   ├─ bundler/
 │   ├─ paths/
 │   └─ tsconfig/
 └─ scripts/ (CLI + helper scripts)
     └─ src/
```## In Nutshell

* **modules/** = sub library
* **packages/** = what you ship to users.
* **devtools/** = what you use to build/maintain those packages.
* **repository/** = meta-data about the repo itself.

---

## In Nutshell

* **modules/** = sub library
* **packages/** = what you ship to users.
* **devtools/** = what you use to build/maintain those packages.
* **repository/** = meta-data about the repo itself.
