import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { UpdateIssueDto, IssueStatus, Priority } from '../../shared/types';

const router = Router();
const prisma = new PrismaClient();

// 모든 작업 조회
router.get('/', async (req, res) => {
  try {
    const { status, priority } = req.query;
    
    const where: any = {};
    if (status) {
      where.status = status as IssueStatus;
    }
    if (priority) {
      where.priority = priority as Priority;
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        attachments: true,
        executions: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(issues);
  } catch (error) {
    console.error('작업 조회 오류:', error);
    res.status(500).json({ error: '작업을 조회하는 중 오류가 발생했습니다.' });
  }
});

// 특정 작업 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        attachments: true,
        executions: {
          orderBy: {
            startedAt: 'desc',
          },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
    }

    res.json(issue);
  } catch (error) {
    console.error('작업 조회 오류:', error);
    res.status(500).json({ error: '작업을 조회하는 중 오류가 발생했습니다.' });
  }
});

// 작업 생성
router.post('/', async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: '제목은 필수입니다.' });
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description: description || null,
        priority: priority || Priority.MEDIUM,
        status: IssueStatus.TODO,
      },
      include: {
        attachments: true,
        executions: true,
      },
    });

    res.status(201).json(issue);
  } catch (error) {
    console.error('작업 생성 오류:', error);
    res.status(500).json({ error: '작업을 생성하는 중 오류가 발생했습니다.' });
  }
});

// 작업 업데이트
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData: UpdateIssueDto = req.body;

    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: {
        attachments: true,
        executions: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 1,
        },
      },
    });

    res.json(issue);
  } catch (error) {
    console.error('작업 업데이트 오류:', error);
    res.status(500).json({ error: '작업을 업데이트하는 중 오류가 발생했습니다.' });
  }
});

// 작업 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.issue.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('작업 삭제 오류:', error);
    res.status(500).json({ error: '작업을 삭제하는 중 오류가 발생했습니다.' });
  }
});

export { router as issuesRouter };
