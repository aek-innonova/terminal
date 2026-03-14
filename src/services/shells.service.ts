import * as fs from "fs";
import * as path from "path";
import { ShellConfig } from "./interfaces/terminal.interfaces.js";

interface ShellCandidate {
  name: string;
  command: string;
  args?: string[];
  paths: string[];
}

const WINDOWS_SHELLS: ShellCandidate[] = [
  {
    name: "PowerShell",
    command: "powershell.exe",
    paths: [
      path.join(
        process.env.SystemRoot ?? "C:\\Windows",
        "System32",
        "WindowsPowerShell",
        "v1.0",
        "powershell.exe",
      ),
    ],
  },
  {
    name: "PowerShell 7",
    command: "pwsh.exe",
    paths: [
      path.join(
        process.env.ProgramFiles ?? "C:\\Program Files",
        "PowerShell",
        "7",
        "pwsh.exe",
      ),
      path.join(
        process.env.ProgramFiles ?? "C:\\Program Files",
        "PowerShell",
        "7-preview",
        "pwsh.exe",
      ),
    ],
  },
  {
    name: "Command Prompt",
    command: "cmd.exe",
    paths: [
      path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "cmd.exe"),
    ],
  },
  {
    name: "Git Bash",
    command: "bash.exe",
    args: ["--login", "-i"],
    paths: [
      path.join(
        process.env.ProgramFiles ?? "C:\\Program Files",
        "Git",
        "bin",
        "bash.exe",
      ),
      path.join(
        process.env["ProgramFiles(x86)"] ?? "C:\\Program Files (x86)",
        "Git",
        "bin",
        "bash.exe",
      ),
    ],
  },
];

const LINUX_SHELLS: ShellCandidate[] = [
  { name: "Bash", command: "/bin/bash", paths: ["/bin/bash", "/usr/bin/bash"] },
  { name: "Zsh", command: "/bin/zsh", paths: ["/bin/zsh", "/usr/bin/zsh"] },
  { name: "Fish", command: "/usr/bin/fish", paths: ["/usr/bin/fish"] },
  { name: "Sh", command: "/bin/sh", paths: ["/bin/sh"] },
];

const MACOS_SHELLS: ShellCandidate[] = [
  { name: "Zsh", command: "/bin/zsh", paths: ["/bin/zsh"] },
  { name: "Bash", command: "/bin/bash", paths: ["/bin/bash"] },
  {
    name: "Fish",
    command: "/usr/local/bin/fish",
    paths: ["/usr/local/bin/fish", "/opt/homebrew/bin/fish"],
  },
  { name: "Sh", command: "/bin/sh", paths: ["/bin/sh"] },
];

export class ShellsService {
  private availableShells: ShellConfig[] | null = null;

  getAvailableShells(): ShellConfig[] {
    if (this.availableShells) {
      return this.availableShells;
    }

    const candidates = this.getCandidatesForPlatform();
    this.availableShells = [];

    for (const candidate of candidates) {
      const resolvedPath = this.resolveShellPath(candidate);
      if (resolvedPath) {
        this.availableShells.push({
          name: candidate.name,
          command: resolvedPath,
          args: candidate.args,
        });
        console.log(`Found shell: ${candidate.name} at ${resolvedPath}`);
      }
    }

    if (this.availableShells.length === 0) {
      const fallback = this.getFallbackShell();
      this.availableShells.push(fallback);
      console.warn(`No shells detected, using fallback: ${fallback.command}`);
    }

    return this.availableShells;
  }

  getDefaultShell(): ShellConfig {
    const shells = this.getAvailableShells();

    const envShell =
      process.platform === "win32" ? process.env.COMSPEC : process.env.SHELL;

    if (envShell) {
      const match = shells.find(
        (s) => s.command.toLowerCase() === envShell.toLowerCase(),
      );
      if (match) return match;
    }

    return shells[0];
  }

  getShellByName(name: string): ShellConfig | undefined {
    return this.getAvailableShells().find(
      (s) => s.name.toLowerCase() === name.toLowerCase(),
    );
  }

  private getCandidatesForPlatform(): ShellCandidate[] {
    switch (process.platform) {
      case "win32":
        return WINDOWS_SHELLS;
      case "darwin":
        return MACOS_SHELLS;
      default:
        return LINUX_SHELLS;
    }
  }

  private resolveShellPath(candidate: ShellCandidate): string | null {
    for (const shellPath of candidate.paths) {
      try {
        if (fs.existsSync(shellPath)) {
          return shellPath;
        }
      } catch {
        // Path check failed, continue to next
      }
    }
    return null;
  }

  private getFallbackShell(): ShellConfig {
    if (process.platform === "win32") {
      return { name: "Command Prompt", command: "cmd.exe" };
    }
    return { name: "Sh", command: "/bin/sh" };
  }
}
