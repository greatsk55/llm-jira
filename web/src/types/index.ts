export type IssueStatus = 'TODO' | 'ING' | 'DONE' | 'PENDING';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ExecutionStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

export const IssueStatus = {
  TODO: 'TODO' as IssueStatus,
  ING: 'ING' as IssueStatus,
  DONE: 'DONE' as IssueStatus,
  PENDING: 'PENDING' as IssueStatus,
};

export const Priority = {
  LOW: 'LOW' as Priority,
  MEDIUM: 'MEDIUM' as Priority,
  HIGH: 'HIGH' as Priority,
};

export const ExecutionStatus = {
  RUNNING: 'RUNNING' as ExecutionStatus,
  SUCCESS: 'SUCCESS' as ExecutionStatus,
  FAILED: 'FAILED' as ExecutionStatus,
};

export interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: Priority;
  createdAt: Date | string;
  updatedAt: Date | string;
  attachments?: Attachment[];
  executions?: Execution[];
}

export interface Attachment {
  id: string;
  issueId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  createdAt: Date | string;
}

export interface Execution {
  id: string;
  issueId: string;
  status: ExecutionStatus;
  llmProvider: string;
  llmResponse: string | null;
  testResults: string | null;
  command: string | null;
  startedAt: Date | string;
  completedAt: Date | string | null;
  error: string | null;
}

export interface Release {
  id: string;
  version: string;
  gitCommitHash: string | null;
  gitTag: string | null;
  snapshot: string;
  createdAt: Date | string;
}

export interface CreateIssueDto {
  title: string;
  description?: string;
  priority?: Priority;
}

export interface UpdateIssueDto {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: Priority;
}
