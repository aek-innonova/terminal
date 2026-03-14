import { app, BrowserWindow, Menu } from "electron";

Menu.setApplicationMenu(null);

const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#404040",
      symbolColor: "#ffffff",
      height: 40,
    },
  });

  win.loadURL("http://localhost:5173/");
};

app.whenReady().then(() => {
  createWindow();
});
