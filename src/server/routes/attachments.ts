import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs-extra';
import { PrismaClient } from '@prisma/client';
import { ensureConfigDir } from '../../shared/config';

const router = Router();
const prisma = new PrismaClient();

// 업로드 디렉토리 설정
const uploadDir = path.join(process.cwd(), '.llm-jira', 'uploads');

// Multer 설정
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

// 파일 업로드
router.post('/:issueId', upload.single('file'), async (req, res) => {
  try {
    const { issueId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: '파일이 제공되지 않았습니다.' });
    }

    // 작업 존재 확인
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      await fs.remove(file.path);
      return res.status(404).json({ error: '작업을 찾을 수 없습니다.' });
    }

    const attachment = await prisma.attachment.create({
      data: {
        issueId,
        fileName: file.originalname,
        filePath: file.path,
        fileType: file.mimetype,
        fileSize: file.size,
      },
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    res.status(500).json({ error: '파일을 업로드하는 중 오류가 발생했습니다.' });
  }
});

// 파일 다운로드
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    if (!await fs.pathExists(attachment.filePath)) {
      return res.status(404).json({ error: '파일이 존재하지 않습니다.' });
    }

    res.download(attachment.filePath, attachment.fileName);
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    res.status(500).json({ error: '파일을 다운로드하는 중 오류가 발생했습니다.' });
  }
});

// 첨부파일 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }

    // 파일 삭제
    if (await fs.pathExists(attachment.filePath)) {
      await fs.remove(attachment.filePath);
    }

    // DB에서 삭제
    await prisma.attachment.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    res.status(500).json({ error: '파일을 삭제하는 중 오류가 발생했습니다.' });
  }
});

export { router as attachmentsRouter };
