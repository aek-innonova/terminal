# Terminal Host WebSocket Protocol

**Transport:** Socket.io v4
**Endpoint:** `ws://{host}:3000`

---

## Client → Server

### `terminal:shells`

List available shells on the host.
**Payload:** _none_
**Response:** `ShellConfig[]`

### `terminal:create`

Spawn a new terminal session.
**Payload:**

```ts
{ shellType?: string   // shell name from shells list (default: platform default)
  cols?: number         // default 80
  rows?: number }       // default 24
```

**Response:** `{ sessionId: string, shell: ShellConfig }`

### `terminal:data`

Send input to a session.
**Payload:** `{ sessionId: string, data: string }`

### `terminal:resize`

Resize a session's PTY.
**Payload:** `{ sessionId: string, cols: number, rows: number }`

### `terminal:close`

Destroy a session.
**Payload:** `{ sessionId: string }`

---

## Server → Client

### `terminal:output`

PTY output from a session.
**Payload:** `{ sessionId: string, data: string }`

### `terminal:exit`

Session process exited.
**Payload:** `{ sessionId: string, exitCode: number }`

---

## Types

```ts
interface ShellConfig {
  name: string; // display name, e.g. "PowerShell", "Git Bash", "Zsh"
  command: string; // resolved path to shell binary
  args?: string[]; // launch arguments
  icon?: string; // shell icon as a data URL (SVG or PNG)
}
```

---

## Lifecycle

1. Connect to the server
2. Emit `terminal:shells` to get available shells (optional)
3. Emit `terminal:create` → receive `sessionId`
4. Bind `xterm.onData` → emit `terminal:data`
5. Bind `xterm.onResize` → emit `terminal:resize`
6. Listen `terminal:output` → call `xterm.write`
7. Listen `terminal:exit` → handle session end
8. Emit `terminal:close` to end a session, or disconnect to end all
