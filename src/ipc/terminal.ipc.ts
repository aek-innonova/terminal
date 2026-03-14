import { ipcMain, type IpcMainInvokeEvent } from "electron";
import type {
  CloseSessionDto,
  CreateSessionDto,
  ResizeDto,
  SessionDataDto,
} from "../services/interfaces/terminal.interfaces.js";
import type { ShellsService } from "../services/shells.service.js";
import type { TerminalService } from "../services/terminal.service.js";

export function registerTerminalIpc(
  shellsService: ShellsService,
  terminalService: TerminalService,
): void {
  const trackedSenders = new Set<number>();

  ipcMain.handle("terminal:shells", () => {
    return shellsService.getAvailableShells();
  });

  ipcMain.handle(
    "terminal:create",
    (event: IpcMainInvokeEvent, options: CreateSessionDto) => {
      const sender = event.sender;
      const clientId = String(sender.id);

      // Track sender for cleanup on window close
      if (!trackedSenders.has(sender.id)) {
        trackedSenders.add(sender.id);
        sender.once("destroyed", () => {
          trackedSenders.delete(sender.id);
          terminalService.destroyAllSessions(clientId);
          console.log(
            `WebContents ${sender.id} destroyed, cleaned up all sessions`,
          );
        });
      }

      const sessionInfo = terminalService.createSession(
        clientId,
        options,
        (data) => {
          if (!sender.isDestroyed()) {
            sender.send("terminal:output", {
              sessionId: sessionInfo.sessionId,
              data,
            });
          }
        },
        (exitCode) => {
          if (!sender.isDestroyed()) {
            sender.send("terminal:exit", {
              sessionId: sessionInfo.sessionId,
              exitCode,
            });
          }
        },
      );

      return sessionInfo;
    },
  );

  ipcMain.on("terminal:data", (event, { sessionId, data }: SessionDataDto) => {
    const clientId = String(event.sender.id);
    terminalService.writeToSession(clientId, sessionId, data);
  });

  ipcMain.on(
    "terminal:resize",
    (event, { sessionId, cols, rows }: ResizeDto) => {
      const clientId = String(event.sender.id);
      terminalService.resizeSession(clientId, sessionId, cols, rows);
    },
  );

  ipcMain.on("terminal:close", (event, { sessionId }: CloseSessionDto) => {
    const clientId = String(event.sender.id);
    terminalService.destroySession(clientId, sessionId);
  });
}
