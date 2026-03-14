import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { execFileSync } from "child_process";
import { app, nativeImage } from "electron";
import { ShellConfig } from "../interfaces/terminal.interfaces.js";
import { ShellScanner, findBundledIcon, SHELL_ICONS } from "./shell.scanner.js";

export class WindowsScanner extends ShellScanner {
  async scan(): Promise<ShellConfig[]> {
    const shells: ShellConfig[] = [];

    const sysRoot = process.env.SystemRoot ?? "C:\\Windows";
    const progFiles = process.env.ProgramFiles ?? "C:\\Program Files";
    const progFilesX86 =
      process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)";

    // PowerShell (Windows built-in)
    const psPath = path.join(
      sysRoot,
      "System32",
      "WindowsPowerShell",
      "v1.0",
      "powershell.exe",
    );
    if (fs.existsSync(psPath)) {
      shells.push(
        await this.curatedProfile(
          "PowerShell",
          psPath,
          undefined,
          "powershell",
        ),
      );
    }

    // Command Prompt
    const cmdPath = path.join(sysRoot, "System32", "cmd.exe");
    if (fs.existsSync(cmdPath)) {
      shells.push(
        await this.curatedProfile("Command Prompt", cmdPath, undefined, "cmd"),
      );
    }

    // PowerShell Core (pwsh) via PATH
    const pwsh = this.which("pwsh.exe");
    if (pwsh) {
      shells.push(
        await this.curatedProfile(
          "PowerShell Core",
          pwsh,
          undefined,
          "powershell",
        ),
      );
    }

    // Git Bash
    const gitBash = this.findGitBash(progFiles, progFilesX86);
    if (gitBash) {
      const icon = await this.resolveGitBashIcon(gitBash);
      shells.push({
        id: randomUUID(),
        name: "Git Bash",
        command: gitBash,
        args: ["--login", "-i"],
        icon,
      });
    }

    // WSL distros
    for (const distro of this.getWslDistros()) {
      const icon = await this.resolveWslDistroIcon(distro);
      shells.push({
        id: randomUUID(),
        name: distro,
        command: "wsl.exe",
        args: ["-d", distro],
        icon,
      });
    }

    // VS Developer shells
    for (const devShell of await this.detectVsDevShells(progFilesX86)) {
      shells.push(devShell);
    }

    return shells;
  }

  getFallbackShell(): ShellConfig {
    return { id: randomUUID(), name: "Command Prompt", command: "cmd.exe" };
  }

  // ---------------------------------------------------------------------------
  // Git Bash
  // ---------------------------------------------------------------------------

  private findGitBash(progFiles: string, progFilesX86: string): string | null {
    const candidates = [
      path.join(progFiles, "Git", "bin", "bash.exe"),
      path.join(progFilesX86, "Git", "bin", "bash.exe"),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }

    const gitExe = this.which("git.exe");
    if (gitExe) {
      const gitRoot = path.dirname(path.dirname(gitExe));
      const bashPath = path.join(gitRoot, "bin", "bash.exe");
      if (fs.existsSync(bashPath)) return bashPath;
    }

    return null;
  }

  private async resolveGitBashIcon(bashExePath: string): Promise<string> {
    const gitRoot = path.resolve(bashExePath, "..", "..");
    const icoPath = path.join(
      gitRoot,
      "mingw64",
      "share",
      "git",
      "git-for-windows.ico",
    );

    if (fs.existsSync(icoPath)) {
      const img = nativeImage.createFromPath(icoPath);
      if (!img.isEmpty()) return img.toDataURL();
    }

    return findBundledIcon("Git Bash") ?? SHELL_ICONS.get("Git Bash")!;
  }

  // ---------------------------------------------------------------------------
  // WSL
  // ---------------------------------------------------------------------------

  private static readonly WSL_DISTRO_ICONS: Record<string, string> = {
    ubuntu: "https://assets.ubuntu.com/v1/49a1a858-favicon-32x32.png",
    debian: "https://www.debian.org/logos/openlogo-nd.svg",
    kali: "https://gitlab.com/kalilinux/packages/kali-themes/-/raw/kali/master/share/icons/hicolor/scalable/apps/kali-menu.svg",
    opensuse: "https://static.opensuse.org/favicon.svg",
    suse: "https://static.opensuse.org/favicon.svg",
    fedora: "https://fedoraproject.org/favicon.ico",
    arch: "https://archlinux.org/static/logos/archlinux-logo-dark-scalable.svg",
    alpine: "https://alpinelinux.org/alpine-logo.ico",
    oracle: "https://www.oracle.com/asset/web/favicons/favicon-32.png",
  };

  private async resolveWslDistroIcon(distro: string): Promise<string> {
    const lower = distro.toLowerCase();

    const url = Object.entries(WindowsScanner.WSL_DISTRO_ICONS).find(([key]) =>
      lower.includes(key),
    )?.[1];

    if (url) {
      try {
        const icon = await this.fetchIconAsDataUrl(url);
        if (icon) return icon;
      } catch {
        // Network failed — fall through to bundled
      }
    }

    return findBundledIcon(distro) ?? SHELL_ICONS.get("linux")!;
  }

  private getWslDistros(): string[] {
    try {
      const buf = execFileSync("wsl.exe", ["-l", "-q"], {
        timeout: 5000,
        windowsHide: true,
      });
      const text = buf.includes(0)
        ? buf.toString("utf16le")
        : buf.toString("utf8");
      return text
        .split(/\r?\n/)
        .map((line) => line.replace(/\0/g, "").trim())
        .filter(
          (line) =>
            line.length > 0 && !line.toLowerCase().startsWith("docker-desktop"),
        );
    } catch {
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Visual Studio Developer shells
  // ---------------------------------------------------------------------------

  private async detectVsDevShells(
    progFilesX86: string,
  ): Promise<ShellConfig[]> {
    const vswhere = path.join(
      progFilesX86,
      "Microsoft Visual Studio",
      "Installer",
      "vswhere.exe",
    );
    if (!fs.existsSync(vswhere)) return [];

    try {
      const output = execFileSync(
        vswhere,
        ["-all", "-property", "installationPath"],
        { encoding: "utf8", timeout: 5000, windowsHide: true },
      );
      const installs = output
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const results: ShellConfig[] = [];

      for (const vsPath of installs) {
        const yearMatch = vsPath.match(/\\(\d{4})\\/);
        const year = yearMatch?.[1] ?? "";

        const devenvPath = path.join(vsPath, "Common7", "IDE", "devenv.exe");
        const vsIcon = await this.resolveVsIcon(devenvPath);

        const batPath = path.join(vsPath, "Common7", "Tools", "VsDevCmd.bat");
        if (fs.existsSync(batPath)) {
          results.push({
            id: randomUUID(),
            name: `Developer Command Prompt for VS ${year}`.trim(),
            command: "cmd.exe",
            args: ["/k", batPath],
            icon: vsIcon,
          });
        }

        const dllPath = path.join(
          vsPath,
          "Common7",
          "Tools",
          "Microsoft.VisualStudio.DevShell.dll",
        );
        if (fs.existsSync(dllPath)) {
          results.push({
            id: randomUUID(),
            name: `Developer PowerShell for VS ${year}`.trim(),
            command: "powershell.exe",
            args: [
              "-NoExit",
              "-Command",
              `& { Import-Module '${dllPath}'; Enter-VsDevShell -SkipAutomaticLocation }`,
            ],
            icon: vsIcon,
          });
        }
      }

      return results;
    } catch {
      return [];
    }
  }

  private async resolveVsIcon(devenvPath: string): Promise<string | undefined> {
    try {
      if (fs.existsSync(devenvPath)) {
        const img = await app.getFileIcon(devenvPath, { size: "large" });
        if (!img.isEmpty()) return img.toDataURL();
      }
    } catch {
      // fall through to bundled
    }
    return findBundledIcon("Developer VS");
  }
}
