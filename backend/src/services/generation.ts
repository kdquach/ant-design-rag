import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAnswer(question: string, chunks: any[]) {
  const context = chunks
    .map(
      (c, i) => `[${i + 1}] (${c.component_name} - ${c.section})\n${c.content}`,
    )
    .join("\n\n");

  const prompt = `Bạn là trợ lý trả lời câu hỏi về thư viện Ant Design, dựa CHỈ vào các đoạn tài liệu dưới đây. Nếu tài liệu không có thông tin liên quan, hãy nói rõ là không tìm thấy trong docs, đừng bịa.

Tài liệu:
${context}

Câu hỏi: ${question}

Trả lời ngắn gọn, chính xác:`;

  const interaction = await ai.interactions.create({
    model: "gemini-3.6-flash",
    input: prompt,
  });

  return interaction.output_text;
}
