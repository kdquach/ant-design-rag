import { glob } from "glob";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

interface Chunk {
  componentName: string;
  section: string;
  sourceUrl: string;
  content: string;
  embedText: string;
}

export async function chunkAllDocs(): Promise<Chunk[]> {
  const files = await glob("../data-source/components/*/index.en-US.md");
  const chunks: Chunk[] = [];

  for (const file of files) {
    const componentName = path.basename(path.dirname(file));

    // guard: bỏ qua nếu không lấy được tên hợp lệ, in ra để debug
    if (!componentName) {
      console.warn("Bỏ qua file không xác định được component:", file);
      continue;
    }

    const raw = fs.readFileSync(file, "utf-8");
    const { content } = matter(raw);
    const sourceUrl = `https://ant.design/components/${componentName}`;

    const sections = content.split(/^## /m).filter(Boolean);
    for (const section of sections) {
      const [title, ...body] = section.split("\n");
      const bodyText = body.join("\n").trim();
      if (!bodyText) continue; // bỏ qua section rỗng

      chunks.push({
        componentName,
        section: title.trim(),
        sourceUrl,
        content: bodyText,
        embedText: `Component: ${componentName}\nSection: ${title.trim()}\n${bodyText}`,
      });
    }
  }
  return chunks;
}
