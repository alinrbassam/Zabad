# RMS Enterprise Architecture Specification

## Overview
The Retail Management System (RMS) is built as a multi-tenant, offline-first Windows desktop application. It operates without internet dependency, persisting all business data locally within a native SQLite engine.

## Process Isolation & System Topology

```mermaid
graph TD
    subgraph Renderer Process (Pure React UI)
        UI[React 18 UI / Vite]
        Store[Zustand Stores]
        Router[React Router]
        Modules[Module Registry Loader]
        UI --> Store
        UI --> Router
        UI --> Modules
    end

    subgraph Preload Layer (Hardened ContextBridge)
        Bridge[window.api Bridge]
        Zod[IPC Input / Output Schema Validation]
        Bridge --> Zod
    end

    subgraph Main Process (Node.js Environment)
        IPC[IPC Dispatchers & Event Bus]
        DB[SQLite Engine / WAL Mode]
        Migrator[Versioned Migration Runner]
        Logger[Rotating File Logger Service]
        Config[App Config Service]
        Interfaces[Printer / Backup / License / Updater Interfaces]

        IPC --> DB
        DB --> Migrator
        IPC --> Config
        IPC --> Logger
        IPC --> Interfaces
    end

    UI --> Bridge
    Bridge --> IPC
```

## Security Guarantees
- `contextIsolation: true`
- `nodeIntegration: false`
- Direct access to Node.js APIs or raw SQL execution from the renderer process is strictly prohibited.
- All IPC channels validate inputs and outputs against Zod schemas in the main process before executing database or filesystem operations.
