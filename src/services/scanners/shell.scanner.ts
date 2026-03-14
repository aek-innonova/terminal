import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { execFileSync } from "child_process";
import { app, net } from "electron";
import { ShellConfig } from "../interfaces/terminal.interfaces.js";
import { SHELL_ICONS, findBundledIcon } from "../shell-icons.js";

export { findBundledIcon, SHELL_ICONS };

export abstract class ShellScanner {
  abstract scan(): Promise<ShellConfig[]>;
  abstract getFallbackShell(): ShellConfig;

  // ---------------------------------------------------------------------------
  // Shared utilities
  // ---------------------------------------------------------------------------

  protected async curatedProfile(
    name: string,
    command: string,
    args: string[] | undefined,
    iconHint: string,
  ): Promise<ShellConfig> {
    const icon = await this.resolveProfileIcon(name, command, iconHint);
    return { id: randomUUID(), name, command, args, icon };
  }

  /**
   * Resolve an icon for a shell profile.
   *
   * Priority:
   * 1. Native icon extracted from the executable
   * 2. Bundled SVG matched by name or hint keyword
   */
  protected async resolveProfileIcon(
    name: string,
    command: string,
    iconHint: string,
  ): Promise<string | undefined> {
    try {
      if (fs.existsSync(command)) {
        const img = await app.getFileIcon(command, { size: "large" });
        if (!img.isEmpty()) return img.toDataURL();
      }
    } catch {
      // fall through to bundled
    }

    return findBundledIcon(name) ?? SHELL_ICONS.get(iconHint);
  }

  protected which(name: string): string | null {
    try {
      const cmd = process.platform === "win32" ? "where.exe" : "which";
      const output = execFileSync(cmd, [name], {
        encoding: "utf8",
        timeout: 3000,
        windowsHide: true,
      });
      const first = output.split(/\r?\n/)[0]?.trim();
      return first && fs.existsSync(first) ? first : null;
    } catch {
      return null;
    }
  }

  protected async fetchIconAsDataUrl(url: string): Promise<string | null> {
    const response = await net.fetch(url, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") ?? "image/png";
    const mimeType = contentType.split(";")[0].trim();
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  }

  protected parseEtcShells(): {
    name: string;
    command: string;
    iconHint: string;
  }[] {
    try {
      const content = fs.readFileSync("/etc/shells", "utf-8");
      const seen = new Set<string>();
      const results: { name: string; command: string; iconHint: string }[] = [];

      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        if (!fs.existsSync(trimmed)) continue;

        const binName = path.basename(trimmed);
        if (seen.has(binName)) continue;
        seen.add(binName);

        const displayName = binName.charAt(0).toUpperCase() + binName.slice(1);

        results.push({
          name: displayName,
          command: trimmed,
          iconHint: binName,
        });
      }

      return results;
    } catch {
      return [];
    }
  }
}
