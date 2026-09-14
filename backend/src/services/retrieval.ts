import { pipeline } from "@xenova/transformers";
import { pool } from "../db/connection";

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

export async function retrieveRelevantChunks(question: string, topK = 5) {
  const embed = await getEmbedder();
  const output = await embed(question, { pooling: "mean", normalize: true });
  const questionVector = Array.from(output.data);

  // THÊM: kiểm tra độ dài vector trước khi query
  console.log(`[debug] Độ dài vector câu hỏi: ${questionVector.length}`);

  try {
    const result = await pool.query(
      `SELECT component_name, section, source_url, content
       FROM documents
       ORDER BY embedding <=> $1
       LIMIT $2`,
      [JSON.stringify(questionVector), topK],
    );
    console.log(`[debug] Số dòng trả về: ${result.rows.length}`);
    return result.rows;
  } catch (err) {
    console.error("[debug] Lỗi khi query retrieval:", err);
    throw err; // ném lại lỗi thay vì nuốt mất
  }
}
