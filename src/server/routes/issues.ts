import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { UpdateIssueDto, IssueStatus, Priority } from '../../shared/types';
import { forceKillTask } from './tasks';

const router = Router();
const prisma = new PrismaClient();

// 모든 작업 조회
router.get('/', async (req, res) => {
  try {
    const { status, priority, domain, search, sortBy, sortOrder } = req.query;

    const where: any = {};

    // 기본 필터링
    if (status) {
      where.status = status as IssueStatus;
    }
    if (priority) {
      where.priority = priority as Priority;
    }
    if (domain) {
      where.domain = domain as string;
    }

    // 검색 기능 (제목 또는 설명)
    if (search && typeof search === 'string') {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // 정렬 옵션
    const orderByField = sortBy as string || 'createdAt';
    const orderByDirection = (sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: any = {};

    // 유효한 필드만 정렬 허용
    const validSortFields = ['createdAt', 'updatedAt', 'title', 'priority', 'status'];
    if (validSortFields.includes(orderByField)) {
      orderBy[orderByField] = orderByDirection;
    } else {
      orderBy.createdAt = 'desc';
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
      orderBy,
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
    const { title, description, priority, domain } = req.body;

    if (!title) {
      return res.status(400).json({ error: '제목은 필수입니다.' });
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description: description || null,
        priority: priority || Priority.MEDIUM,
        domain: domain || null,
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

// 작업 상태 업데이트 (LLM이 사용)
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    // 상태 검증
    const validStatuses: IssueStatus[] = [
      IssueStatus.TODO,
      IssueStatus.ING,
      IssueStatus.DONE,
      IssueStatus.PENDING,
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: '유효하지 않은 상태입니다.',
        validStatuses,
      });
    }

    // Issue 존재 확인
    const existingIssue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!existingIssue) {
      return res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
    }

    // 상태 업데이트
    const issue = await prisma.issue.update({
      where: { id },
      data: { status },
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

    // 로그 출력
    console.log(`✅ Issue ${id} 상태 업데이트: ${existingIssue.status} → ${status}`);
    if (reason) {
      console.log(`   이유: ${reason}`);
    }

    res.json({
      success: true,
      issue,
      previousStatus: existingIssue.status,
      newStatus: status,
    });
  } catch (error) {
    console.error('상태 업데이트 오류:', error);
    res.status(500).json({ error: '상태를 업데이트하는 중 오류가 발생했습니다.' });
  }
});

// 작업 삭제 (실행 중인 작업도 강제 삭제)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Issue 존재 확인
    const existingIssue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!existingIssue) {
      return res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
    }

    // 실행 중인 작업이 있으면 강제 종료
    const wasKilled = await forceKillTask(id);
    if (wasKilled) {
      console.log(`✅ Task ${id} was running and has been forcefully terminated`);
    }

    // Issue 삭제 (Cascade로 모든 관련 데이터 삭제)
    await prisma.issue.delete({
      where: { id },
    });

    console.log(`🗑️ Issue ${id} deleted successfully`);
    res.status(204).send();
  } catch (error) {
    console.error('작업 삭제 오류:', error);
    res.status(500).json({ error: '작업을 삭제하는 중 오류가 발생했습니다.' });
  }
});

export { router as issuesRouter };
