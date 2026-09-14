import fs from "fs";
import path from "path";
import { retrieveRelevantChunks } from "../src/services/retrieval";

interface TestCase {
  question: string;
  expectedComponent: string;
}

async function runEval() {
  const testCases: TestCase[] = JSON.parse(
    fs.readFileSync(path.join(__dirname, "questions.json"), "utf-8"),
  );

  let correct = 0;
  const results: any[] = [];

  for (const test of testCases) {
    const chunks = await retrieveRelevantChunks(test.question, 5);
    const retrievedComponents = chunks.map((c) => c.component_name);
    const isCorrect = retrievedComponents.includes(test.expectedComponent);
    if (isCorrect) correct++;

    results.push({
      question: test.question,
      expected: test.expectedComponent,
      retrieved: retrievedComponents,
      correct: isCorrect,
    });

    console.log(
      `${isCorrect ? "✅" : "❌"} "${test.question}" → nhận: [${retrievedComponents.join(", ")}]`,
    );
  }

  const accuracy = ((correct / testCases.length) * 100).toFixed(1);
  console.log(
    `\nĐộ chính xác retrieval (top-5): ${accuracy}% (${correct}/${testCases.length})`,
  );

  fs.writeFileSync(
    path.join(__dirname, "results.json"),
    JSON.stringify({ accuracy, results }, null, 2),
  );
}

runEval().then(() => process.exit(0));
