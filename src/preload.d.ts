import type { TerminalAPI } from "./preload.js";

declare global {
  interface Window {
    terminalAPI: TerminalAPI;
  }
}
