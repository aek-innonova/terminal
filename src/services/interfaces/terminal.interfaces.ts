export interface ShellConfig {
  id: string;
  name: string;
  command: string;
  args?: string[];
  icon?: string;
  isDefault?: boolean;
}

export interface ProfilesFile {
  profiles: ShellConfig[];
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
