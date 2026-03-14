import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";
import { app } from "electron";
import { ShellConfig, ProfilesFile } from "./interfaces/terminal.interfaces.js";
import type { ShellScanner } from "./scanners/shell.scanner.js";
import { WindowsScanner } from "./scanners/windows.scanner.js";
import { LinuxScanner } from "./scanners/linux.scanner.js";
import { MacScanner } from "./scanners/mac.scanner.js";

export class ShellsService {
  private profiles: ShellConfig[] = [];
  private readonly scanner: ShellScanner;

  constructor() {
    switch (process.platform) {
      case "win32":
        this.scanner = new WindowsScanner();
        break;
      case "darwin":
        this.scanner = new MacScanner();
        break;
      default:
        this.scanner = new LinuxScanner();
        break;
    }
  }

  private get profilesPath(): string {
    return path.join(app.getPath("userData"), "profiles.json");
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  async init(): Promise<void> {
    const loaded = this.loadProfiles();
    if (loaded.length > 0) {
      this.profiles = loaded;
      return;
    }

    // First launch — scan and persist
    this.profiles = await this.scanForShells();
    this.saveProfiles();
  }

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  getAvailableShells(): ShellConfig[] {
    return this.profiles;
  }

  getDefaultShell(): ShellConfig {
    const shells = this.getAvailableShells();

    // 1. Explicit isDefault flag
    const explicit = shells.find((s) => s.isDefault);
    if (explicit) return explicit;

    // 2. Match COMSPEC / SHELL env var
    const envShell =
      process.platform === "win32" ? process.env.COMSPEC : process.env.SHELL;
    if (envShell) {
      const match = shells.find(
        (s) => s.command.toLowerCase() === envShell.toLowerCase(),
      );
      if (match) return match;
    }

    // 3. First in list
    return shells[0];
  }

  getShellByName(name: string): ShellConfig | undefined {
    return this.profiles.find(
      (s) => s.name.toLowerCase() === name.toLowerCase(),
    );
  }

  getShellById(id: string): ShellConfig | undefined {
    return this.profiles.find((s) => s.id === id);
  }

  // ---------------------------------------------------------------------------
  // Mutations (CRUD)
  // ---------------------------------------------------------------------------

  addProfile(profile: Omit<ShellConfig, "id">): ShellConfig {
    const newProfile: ShellConfig = { ...profile, id: randomUUID() };
    this.profiles.push(newProfile);
    this.saveProfiles();
    return newProfile;
  }

  updateProfile(profile: ShellConfig): ShellConfig | null {
    const idx = this.profiles.findIndex((p) => p.id === profile.id);
    if (idx === -1) return null;
    this.profiles[idx] = profile;
    this.saveProfiles();
    return profile;
  }

  removeProfile(id: string): boolean {
    if (this.profiles.length <= 1) return false;
    const idx = this.profiles.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.profiles.splice(idx, 1);
    this.saveProfiles();
    return true;
  }

  setDefaultProfile(id: string): boolean {
    const target = this.profiles.find((p) => p.id === id);
    if (!target) return false;
    for (const p of this.profiles) {
      p.isDefault = p.id === id ? true : undefined;
    }
    this.saveProfiles();
    return true;
  }

  async rescan(): Promise<ShellConfig[]> {
    const detected = await this.scanForShells();

    // Merge: add newly detected shells that aren't already present.
    // Match by command + args to avoid duplicates.
    for (const shell of detected) {
      const argsKey = JSON.stringify(shell.args ?? []);
      const exists = this.profiles.some(
        (p) =>
          p.command.toLowerCase() === shell.command.toLowerCase() &&
          JSON.stringify(p.args ?? []) === argsKey,
      );
      if (!exists) {
        this.profiles.push(shell);
      }
    }

    this.saveProfiles();
    return this.profiles;
  }

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  private loadProfiles(): ShellConfig[] {
    try {
      const raw = fs.readFileSync(this.profilesPath, "utf-8");
      const data: ProfilesFile = JSON.parse(raw);
      if (Array.isArray(data.profiles) && data.profiles.length > 0) {
        return data.profiles;
      }
    } catch {
      // Missing or malformed — will trigger a scan
    }
    return [];
  }

  private saveProfiles(): void {
    const data: ProfilesFile = { profiles: this.profiles };
    const dir = path.dirname(this.profilesPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.profilesPath, JSON.stringify(data, null, 2));
  }

  // ---------------------------------------------------------------------------
  // Scanning (delegates to platform scanner)
  // ---------------------------------------------------------------------------

  private async scanForShells(): Promise<ShellConfig[]> {
    const shells = await this.scanner.scan();

    if (shells.length === 0) {
      shells.push(this.scanner.getFallbackShell());
    }

    return shells;
  }
}
