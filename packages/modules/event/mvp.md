# @monitext/event — MVP Specification

## Introduction

`@monitext/event` is designed as a plug-and-play event system. Its architecture is inspired by **event-driven** and **I/O-like patterns**, offering a flexible, multibus structure for handling complex data flows.

---

## Usage Mockup

```ts
import { Monitor, Plugin } from "@monitext/event";
import { exportToServer, observer, prettyPrint } from "@monitext/plugins";

const bus = new Monitor({
    plugins: [
        prettyPrint({
            mode: "json",
            spacing: 2,
            stdout: (msg, level) => customExport(msg, level),
        }),
        observer(),
        exportToServer({
            encrypt: "rsa",
            target: "v1.monitext.tech/api",
            publicProjectId: "your_project_id",
        }),
    ],
});

// Grab exposed plugin helpers
const { observer: obs } = bus.plugins();

// Define rules
bus.rules({
    exportPlugin: {
        receive: [
            "exportFail",
            "e-observableFn",
            (e) => e.type === "test-event",
        ],
        filter: (event, data) => data.read().content !== null,
    },
});

// Hook into emitted data
bus.hook("observer-ip", {
    onEmit(data) {
        data.merge({
            on: "content",
            values: redact({ target: data.content, mode: "dfs" }),
        });
    },
});

// Safe function wrapper
const safeAdd = obs.safe(
    (a, b) => {
        if (typeof a !== "number" || typeof b !== "number") {
            throw new TypeError("Both args must be numbers");
        }
        return a + b;
    },
    { level: 0, name: "TestFn" }
);
```

---

## Symbol Clarification

### Monitor

A **Monitor** is a **multibus-like structure** that can host one or multiple endpoints (plugins). Each endpoint lives on its own branch (sub-bus) of the monitor. The **main branch** acts as a broadcast layer, controlling which plugin receives which events.

Monitors can have **rules** and **hooks** to constrain or enhance plugin behavior:

* **Rules** define how a plugin interacts with the monitor: what events it can receive (all events, specific events, or filtered events).
* **Hooks** allow intercepting or transforming data during emission or reception by a plugin.

---

### Plugin

> Notes: For this architecture to work, plugins must be implemented as **factories** that return `[pluginInstance, config]`. This makes them plug-and-play: instantiation alone is enough to make the plugin usable.

A **plugin** is a self-contained behavior that attaches to a monitor via a context object, typically `{ subscribe, emit, on, userCfg }` passed to its initialization function.

Plugins can also expose a **namespace**, which is a function returning helper methods or metadata. For example, the `observer` plugin exposes a namespace in the usage mockup above:

```ts
const { observer: obs } = bus.plugins();
obs.safe(...);
```

This namespace allows controlled access to plugin methods while keeping the monitor’s internal state encapsulated.
