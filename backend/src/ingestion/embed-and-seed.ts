import { pipeline } from "@xenova/transformers";
import { pool } from "../db/connection";
import { chunkAllDocs } from "./chunk-docs";

async function main() {
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2",
  );
  const chunks = await chunkAllDocs();

  console.log(`Chuẩn bị nạp ${chunks.length} chunks...`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk.content) continue;

    try {
      const output = await embedder(chunk.embedText, {
        pooling: "mean",
        normalize: true,
      });
      const embedding = Array.from(output.data);

      await pool.query(
        `INSERT INTO documents (component_name, section, source_url, content, embedding)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          chunk.componentName,
          chunk.section,
          chunk.sourceUrl,
          chunk.content,
          JSON.stringify(embedding),
        ],
      );
      success++;
    } catch (err) {
      failed++;
      console.error(
        `Lỗi ở chunk #${i} (${chunk.componentName} - ${chunk.section}):`,
        err,
      );
    }

    if ((i + 1) % 50 === 0) {
      console.log(`Đã xử lý ${i + 1}/${chunks.length}...`);
    }
  }

  console.log(`Nạp dữ liệu hoàn tất. Thành công: ${success}, Lỗi: ${failed}`);
  await pool.end();
}

main().catch(console.error);
