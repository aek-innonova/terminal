import * as fs from "fs";
import { randomUUID } from "crypto";
import { ShellConfig } from "../interfaces/terminal.interfaces.js";
import { ShellScanner } from "./shell.scanner.js";

export class LinuxScanner extends ShellScanner {
  private static readonly FALLBACK_CANDIDATES = [
    { name: "Bash", cmd: "/bin/bash", paths: ["/bin/bash", "/usr/bin/bash"] },
    { name: "Zsh", cmd: "/bin/zsh", paths: ["/bin/zsh", "/usr/bin/zsh"] },
    { name: "Fish", cmd: "/usr/bin/fish", paths: ["/usr/bin/fish"] },
    { name: "Sh", cmd: "/bin/sh", paths: ["/bin/sh"] },
  ];

  async scan(): Promise<ShellConfig[]> {
    const shells: ShellConfig[] = [];
    const etcShells = this.parseEtcShells();

    if (etcShells.length > 0) {
      for (const s of etcShells) {
        shells.push(
          await this.curatedProfile(s.name, s.command, undefined, s.iconHint),
        );
      }
    } else {
      for (const c of LinuxScanner.FALLBACK_CANDIDATES) {
        const resolved = c.paths.find((p) => fs.existsSync(p));
        if (resolved) {
          shells.push(
            await this.curatedProfile(
              c.name,
              resolved,
              undefined,
              c.name.toLowerCase(),
            ),
          );
        }
      }
    }

    return shells;
  }

  getFallbackShell(): ShellConfig {
    return { id: randomUUID(), name: "Sh", command: "/bin/sh" };
  }
}
