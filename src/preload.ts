import { contextBridge, ipcRenderer } from "electron";
import type {
  CreateSessionDto,
  SessionExitEvent,
  SessionInfo,
  SessionOutputEvent,
  ShellConfig,
} from "./services/interfaces/terminal.interfaces.js";

const terminalAPI = {
  listShells(): Promise<ShellConfig[]> {
    return ipcRenderer.invoke("terminal:shells");
  },

  createSession(options?: CreateSessionDto): Promise<SessionInfo> {
    return ipcRenderer.invoke("terminal:create", options ?? {});
  },

  sendData(sessionId: string, data: string): void {
    ipcRenderer.send("terminal:data", { sessionId, data });
  },

  resize(sessionId: string, cols: number, rows: number): void {
    ipcRenderer.send("terminal:resize", { sessionId, cols, rows });
  },

  closeSession(sessionId: string): void {
    ipcRenderer.send("terminal:close", { sessionId });
  },

  onOutput(callback: (event: SessionOutputEvent) => void): void {
    ipcRenderer.on("terminal:output", (_event, data: SessionOutputEvent) =>
      callback(data),
    );
  },

  onExit(callback: (event: SessionExitEvent) => void): void {
    ipcRenderer.on("terminal:exit", (_event, data: SessionExitEvent) =>
      callback(data),
    );
  },

  removeAllListeners(): void {
    ipcRenderer.removeAllListeners("terminal:output");
    ipcRenderer.removeAllListeners("terminal:exit");
  },

  // Profile CRUD
  addProfile(profile: Omit<ShellConfig, "id">): Promise<ShellConfig> {
    return ipcRenderer.invoke("terminal:addProfile", profile);
  },

  updateProfile(profile: ShellConfig): Promise<ShellConfig | null> {
    return ipcRenderer.invoke("terminal:updateProfile", profile);
  },

  removeProfile(id: string): Promise<boolean> {
    return ipcRenderer.invoke("terminal:removeProfile", id);
  },

  setDefault(id: string): Promise<boolean> {
    return ipcRenderer.invoke("terminal:setDefault", id);
  },

  rescanShells(): Promise<ShellConfig[]> {
    return ipcRenderer.invoke("terminal:rescan");
  },
};

contextBridge.exposeInMainWorld("terminalAPI", terminalAPI);

export type TerminalAPI = typeof terminalAPI;
