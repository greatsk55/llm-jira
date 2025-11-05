import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExecutionStatus } from '../../shared/types';

const router = Router();
const prisma = new PrismaClient();

// 실행 기록 조회
router.get('/', async (req, res) => {
  try {
    const { issueId } = req.query;

    const where: any = {};
    if (issueId) {
      where.issueId = issueId as string;
    }

    const executions = await prisma.execution.findMany({
      where,
      orderBy: {
        startedAt: 'desc',
      },
    });

    res.json(executions);
  } catch (error) {
    console.error('실행 기록 조회 오류:', error);
    res.status(500).json({ error: '실행 기록을 조회하는 중 오류가 발생했습니다.' });
  }
});

// 특정 실행 기록 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const execution = await prisma.execution.findUnique({
      where: { id },
      include: {
        issue: true,
      },
    });

    if (!execution) {
      return res.status(404).json({ error: '실행 기록을 찾을 수 없습니다.' });
    }

    res.json(execution);
  } catch (error) {
    console.error('실행 기록 조회 오류:', error);
    res.status(500).json({ error: '실행 기록을 조회하는 중 오류가 발생했습니다.' });
  }
});

// 실행 상태 업데이트 (SSE를 위한 웹소켓 또는 폴링용)
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const execution = await prisma.execution.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        error: true,
      },
    });

    if (!execution) {
      return res.status(404).json({ error: '실행 기록을 찾을 수 없습니다.' });
    }

    res.json(execution);
  } catch (error) {
    console.error('실행 상태 조회 오류:', error);
    res.status(500).json({ error: '실행 상태를 조회하는 중 오류가 발생했습니다.' });
  }
});

export { router as executionsRouter };
