export interface ShellConfig {
  name: string;
  command: string;
  args?: string[];
}

export interface CreateSessionDto {
  shellType?: string;
  cols?: number;
  rows?: number;
}

export interface ResizeDto {
  sessionId: string;
  cols: number;
  rows: number;
}

export interface SessionDataDto {
  sessionId: string;
  data: string;
}

export interface CloseSessionDto {
  sessionId: string;
}

export interface SessionInfo {
  sessionId: string;
  shell: ShellConfig;
}

export interface SessionExitEvent {
  sessionId: string;
  exitCode: number;
}

export interface SessionOutputEvent {
  sessionId: string;
  data: string;
}
