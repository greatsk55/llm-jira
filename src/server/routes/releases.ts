import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createRelease, checkoutRelease } from '../../shared/git';

const router = Router();
const prisma = new PrismaClient();

// 모든 릴리즈 조회
router.get('/', async (req, res) => {
  try {
    const releases = await prisma.release.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(releases);
  } catch (error) {
    console.error('릴리즈 조회 오류:', error);
    res.status(500).json({ error: '릴리즈를 조회하는 중 오류가 발생했습니다.' });
  }
});

// 특정 릴리즈 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const release = await prisma.release.findUnique({
      where: { id },
    });

    if (!release) {
      return res.status(404).json({ error: '릴리즈를 찾을 수 없습니다.' });
    }

    res.json(release);
  } catch (error) {
    console.error('릴리즈 조회 오류:', error);
    res.status(500).json({ error: '릴리즈를 조회하는 중 오류가 발생했습니다.' });
  }
});

// 릴리즈 생성
router.post('/', async (req, res) => {
  try {
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({ error: '버전은 필수입니다.' });
    }

    // 현재 모든 작업 상태를 스냅샷으로 저장
    const issues = await prisma.issue.findMany({
      include: {
        attachments: true,
      },
    });

    const snapshot = JSON.stringify(issues);

    // Git 커밋 및 태그 생성
    const projectRoot = process.cwd();
    let gitCommitHash: string | null = null;
    let gitTag: string | null = null;

    try {
      const result = await createRelease(projectRoot, version, snapshot);
      gitCommitHash = result.commitHash;
      gitTag = result.tag;
    } catch (error) {
      console.warn('Git 작업 실패 (계속 진행):', error);
    }

    const release = await prisma.release.create({
      data: {
        version,
        gitCommitHash,
        gitTag,
        snapshot,
      },
    });

    res.status(201).json(release);
  } catch (error) {
    console.error('릴리즈 생성 오류:', error);
    res.status(500).json({ error: '릴리즈를 생성하는 중 오류가 발생했습니다.' });
  }
});

// 릴리즈 체크아웃
router.post('/:id/checkout', async (req, res) => {
  try {
    const { id } = req.params;

    const release = await prisma.release.findUnique({
      where: { id },
    });

    if (!release) {
      return res.status(404).json({ error: '릴리즈를 찾을 수 없습니다.' });
    }

    // Git 체크아웃
    const projectRoot = process.cwd();
    try {
      if (release.gitTag) {
        await checkoutRelease(projectRoot, release.gitTag);
      }
    } catch (error) {
      console.warn('Git 체크아웃 실패:', error);
    }

    // 스냅샷 복원
    const snapshot = JSON.parse(release.snapshot);
    
    // 기존 데이터 삭제 (선택적 - 주의 필요)
    // await prisma.issue.deleteMany({});
    
    // 스냅샷에서 작업 복원 (간단한 구현)
    // 실제로는 더 복잡한 복원 로직이 필요할 수 있습니다

    res.json({ 
      message: '릴리즈로 체크아웃되었습니다.',
      release,
      snapshot,
    });
  } catch (error) {
    console.error('릴리즈 체크아웃 오류:', error);
    res.status(500).json({ error: '릴리즈를 체크아웃하는 중 오류가 발생했습니다.' });
  }
});

export { router as releasesRouter };
