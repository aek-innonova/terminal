import { randomUUID } from "crypto";
import * as pty from "node-pty";
import {
  CreateSessionDto,
  SessionInfo,
  ShellConfig,
} from "./interfaces/terminal.interfaces.js";
import { ShellsService } from "./shells.service.js";

interface ManagedSession {
  pty: pty.IPty;
  shell: ShellConfig;
}

export class TerminalService {
  private readonly sessions = new Map<string, ManagedSession>();

  constructor(private readonly shellsService: ShellsService) {}

  createSession(
    clientId: string,
    options: CreateSessionDto,
    onData: (data: string) => void,
    onExit: (exitCode: number) => void,
  ): SessionInfo {
    const shell = options.shellType
      ? this.shellsService.getShellByName(options.shellType)
      : undefined;
    const resolvedShell = shell ?? this.shellsService.getDefaultShell();
    const cols = options.cols ?? 80;
    const rows = options.rows ?? 24;

    const sessionId = randomUUID();
    const key = this.sessionKey(clientId, sessionId);

    const env = { ...process.env } as Record<string, string>;

    const ptyProcess = pty.spawn(
      resolvedShell.command,
      resolvedShell.args ?? [],
      {
        name: "xterm-256color",
        cols,
        rows,
        cwd: this.getInitialCwd(),
        env,
      },
    );

    ptyProcess.onData(onData);

    ptyProcess.onExit(({ exitCode }) => {
      this.sessions.delete(key);
      console.log(
        `Session ${sessionId} for client ${clientId} exited with code ${exitCode}`,
      );
      onExit(exitCode);
    });

    this.sessions.set(key, { pty: ptyProcess, shell: resolvedShell });

    console.log(
      `Created session ${sessionId} for client ${clientId} using ${resolvedShell.name}`,
    );

    return { sessionId, shell: resolvedShell };
  }

  writeToSession(clientId: string, sessionId: string, data: string): void {
    const session = this.getSession(clientId, sessionId);
    if (session) {
      session.pty.write(data);
    }
  }

  resizeSession(
    clientId: string,
    sessionId: string,
    cols: number,
    rows: number,
  ): void {
    const session = this.getSession(clientId, sessionId);
    if (session) {
      session.pty.resize(cols, rows);
    }
  }

  destroySession(clientId: string, sessionId: string): void {
    const key = this.sessionKey(clientId, sessionId);
    const session = this.sessions.get(key);
    if (session) {
      session.pty.kill();
      this.sessions.delete(key);
      console.log(`Destroyed session ${sessionId} for client ${clientId}`);
    }
  }

  destroyAllSessions(clientId: string): void {
    const prefix = `${clientId}:`;
    for (const [key, session] of this.sessions) {
      if (key.startsWith(prefix)) {
        session.pty.kill();
        this.sessions.delete(key);
      }
    }
    console.log(`Destroyed all sessions for client ${clientId}`);
  }

  private getSession(
    clientId: string,
    sessionId: string,
  ): ManagedSession | undefined {
    const key = this.sessionKey(clientId, sessionId);
    const session = this.sessions.get(key);
    if (!session) {
      console.warn(`Session ${sessionId} not found for client ${clientId}`);
    }
    return session;
  }

  private sessionKey(clientId: string, sessionId: string): string {
    return `${clientId}:${sessionId}`;
  }

  private getInitialCwd(): string {
    return process.env.HOME ?? process.env.USERPROFILE ?? process.cwd();
  }
}
