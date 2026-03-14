import * as path from "path";
import { app, BrowserWindow, Menu } from "electron";
import { ShellsService } from "./services/shells.service.js";
import { TerminalService } from "./services/terminal.service.js";
import { registerTerminalIpc } from "./ipc/terminal.ipc.js";

Menu.setApplicationMenu(null);

const shellsService = new ShellsService();
const terminalService = new TerminalService(shellsService);
registerTerminalIpc(shellsService, terminalService);

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#333333",
      symbolColor: "#ffffff",
      height: 40,
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:5173/");
};

app.whenReady().then(async () => {
  await shellsService.init();
  createWindow();
});
