import fs from "fs";
import path from "path";

import { retrieveRelevantChunks } from "../backend/src/services/retrieval";

interface TestCase {
  question: string;
  expectedComponent: string;
}

async function runEval() {
  const testCases: TestCase[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "questions.json"), "utf-8"),
  );

  const normalCases = testCases.filter(
    (t) => t.expectedComponent !== "___NONE___",
  );
  const trapCases = testCases.filter(
    (t) => t.expectedComponent === "___NONE___",
  );

  let correct = 0;
  const results: any[] = [];

  console.log("=== Retrieval Accuracy ===");
  for (const test of normalCases) {
    const chunks = await retrieveRelevantChunks(test.question, 5);
    const retrievedComponents = chunks.map((c) => c.component_name);
    const isCorrect = retrievedComponents.includes(test.expectedComponent);
    if (isCorrect) correct++;

    results.push({
      ...test,
      retrieved: retrievedComponents,
      correct: isCorrect,
    });
    console.log(
      `${isCorrect ? "✅" : "❌"} "${test.question}" → nhận: [${retrievedComponents.join(", ")}]`,
    );
  }

  const accuracy = ((correct / normalCases.length) * 100).toFixed(1);
  console.log(
    `\nĐộ chính xác retrieval (top-5): ${accuracy}% (${correct}/${normalCases.length})`,
  );

  console.log("\n=== Trap Questions (kiểm tra có bịa không) ===");
  console.log(
    'Lưu ý: các câu này cần xem THỦ CÔNG qua API /chat để đánh giá AI có nói "không tìm thấy" hay bịa ra câu trả lời.',
  );
  for (const test of trapCases) {
    console.log(
      `⚠️  "${test.question}" — hãy gọi API /chat với câu này và tự đọc câu trả lời`,
    );
  }

  fs.writeFileSync(
    path.join(__dirname, "results.json"),
    JSON.stringify(
      { accuracy, results, trapQuestions: trapCases.map((t) => t.question) },
      null,
      2,
    ),
  );
}

runEval().then(() => process.exit(0));
