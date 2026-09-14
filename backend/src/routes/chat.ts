import { Router } from "express";
import { retrieveRelevantChunks } from "../services/retrieval";
import { generateAnswer } from "../services/generation";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Thiếu câu hỏi" });

    const chunks = await retrieveRelevantChunks(question);
    const answer = await generateAnswer(question, chunks);

    res.json({
      answer,
      sources: chunks.map((c) => ({
        component: c.component_name,
        url: c.source_url,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Có lỗi xảy ra" });
  }
});

export default router;
