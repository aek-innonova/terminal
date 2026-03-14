import { app, BrowserWindow } from "electron";
import path from "path";

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  win.loadFile(path.join(__dirname, "..", "index.html"));
};

app.whenReady().then(() => {
  createWindow();
});
