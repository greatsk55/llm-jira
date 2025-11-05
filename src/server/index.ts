import express from 'express';
import cors from 'cors';
import * as path from 'path';
import { issuesRouter } from './routes/issues';
import { attachmentsRouter } from './routes/attachments';
import { executionsRouter } from './routes/executions';
import { releasesRouter } from './routes/releases';
import tasksRouter from './routes/tasks';
import { llmRouter } from './routes/llm';
import { getConfigDir } from '../shared/config';

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (업로드된 파일)
app.use('/uploads', express.static(path.join(process.cwd(), '.llm-jira', 'uploads')));

// API 라우트
app.use('/api/issues', issuesRouter);
app.use('/api/attachments', attachmentsRouter);
app.use('/api/executions', executionsRouter);
app.use('/api/releases', releasesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/llm', llmRouter);

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 웹 UI 서빙 (빌드된 파일이 있으면 서빙)
const webDistPath = path.join(__dirname, '../../web/dist');
const fs = require('fs');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

export function startServer(projectRoot: string = process.cwd()) {
  app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT}에서 실행 중입니다.`);
    console.log(`프로젝트 루트: ${projectRoot}`);
  });
}

if (require.main === module) {
  startServer();
}
