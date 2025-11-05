import { Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();

// POST /api/llm/generate-rules
router.post('/generate-rules', async (req, res) => {
  try {
    const { language } = req.body;

    if (!language || !['ko', 'en', 'ja', 'zh'].includes(language)) {
      return res.status(400).json({ error: '유효하지 않은 언어입니다.' });
    }

    const projectRoot = process.cwd();
    const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');

    // Read the actual CLAUDE.md file
    if (!fs.existsSync(claudeMdPath)) {
      return res.status(404).json({ error: 'CLAUDE.md 파일을 찾을 수 없습니다.' });
    }

    const claudeContent = fs.readFileSync(claudeMdPath, 'utf-8');

    // For now, we use the same content for all providers
    // In the future, we can implement translation or provider-specific customization
    const providerContent = {
      claude: claudeContent,
      chatgpt: claudeContent.replace(/# Claude/g, '# ChatGPT'),
      gemini: claudeContent.replace(/# Claude/g, '# Gemini'),
    };

    // Generate rule files
    const files = [
      { name: 'CLAUDE.md', content: providerContent.claude },
      { name: 'CHATGPT.md', content: providerContent.chatgpt },
      { name: 'GEMINI.md', content: providerContent.gemini },
    ];

    for (const file of files) {
      const filePath = path.join(projectRoot, file.name);
      fs.writeFileSync(filePath, file.content, 'utf-8');
    }

    res.json({
      success: true,
      message: '룰 파일이 생성되었습니다.',
      files: files.map((f) => f.name),
      note: 'CLAUDE.md의 최신 내용이 모든 LLM 룰 파일에 반영되었습니다.',
    });
  } catch (error) {
    console.error('룰 파일 생성 오류:', error);
    res.status(500).json({ error: '룰 파일 생성에 실패했습니다.' });
  }
});

export const llmRouter = router;
