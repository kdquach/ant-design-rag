import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import type { Message } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/api/chat`, { question });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.answer,
          sources: res.data.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Có lỗi khi kết nối tới máy chủ. Thử lại sau.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <span style={styles.headerMark}>›</span>
        <span style={styles.headerTitle}>Ant Design — Docs Reference</span>
      </header>

      <div style={styles.scrollArea}>
        <div style={styles.column}>
          {messages.length === 0 && (
            <p style={styles.empty}>
              Đặt câu hỏi về bất kỳ component nào của Ant Design. Câu trả lời
              được lấy trực tiếp từ tài liệu chính thức, kèm nguồn trích dẫn.
            </p>
          )}

          {messages.map((m, i) => {
            const isLast = i === messages.length - 1;
            if (m.role === "user") {
              return (
                <div
                  key={i}
                  style={{ ...styles.entry, ...(isLast ? styles.riseIn : {}) }}
                >
                  <div style={styles.question}>
                    <span style={styles.qMark}>Q</span>
                    <span>{m.content}</span>
                  </div>
                </div>
              );
            }
            const uniqueSources = m.sources
              ? Array.from(
                  new Map(m.sources.map((s) => [s.component, s])).values(),
                )
              : [];
            return (
              <div
                key={i}
                style={{ ...styles.entry, ...(isLast ? styles.riseIn : {}) }}
              >
                <div style={styles.answer}>
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
                {uniqueSources.length > 0 && (
                  <div style={styles.sourceLine}>
                    <span style={styles.sourceLabel}>sources</span>
                    {uniqueSources.map((s, idx) => (
                      <span key={s.component}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.sourceLink}
                        >
                          {s.component}
                        </a>
                        {idx < uniqueSources.length - 1 && (
                          <span style={styles.sourceComma}>, </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {loading && <div style={styles.thinking}>thinking…</div>}
          <div ref={bottomRef} />
        </div>
      </div>

      <div style={styles.inputBar}>
        <div style={styles.column}>
          <div style={styles.inputRow}>
            <span style={styles.prompt}>›</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="hỏi về một component…"
              disabled={loading}
              style={styles.input}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    maxWidth: 900,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "18px 24px",
    borderBottom: "1px solid var(--color-border)",
  },
  headerMark: {
    color: "var(--color-accent)",
    fontFamily: "var(--font-mono)",
    fontSize: 18,
  },
  headerTitle: {
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  scrollArea: { flex: 1, overflowY: "auto", padding: "32px 24px" },
  column: { maxWidth: 680, margin: "left" },
  empty: {
    fontFamily: "var(--font-serif)",
    color: "var(--color-text-muted)",
    fontSize: 17,
    lineHeight: 1.7,
  },
  entry: { marginBottom: 28 },
  riseIn: { animation: "rise-in 180ms ease-out" },
  question: {
    display: "flex",
    gap: 10,
    fontFamily: "var(--font-sans)",
    fontWeight: 500,
    fontSize: 15,
    color: "var(--color-text)",
  },
  qMark: { color: "var(--color-accent)", fontFamily: "var(--font-mono)" },
  answer: {
    fontFamily: "var(--font-serif)",
    fontSize: 17,
    lineHeight: 1.75,
    color: "var(--color-text)",
    marginTop: 10,
  },
  sourceLine: {
    marginTop: 12,
    paddingTop: 10,
    borderTop: "1px solid var(--color-border)",
    fontFamily: "var(--font-mono)",
    fontSize: 13,
  },
  sourceLabel: { color: "var(--color-text-muted)", marginRight: 10 },
  sourceLink: { color: "var(--color-accent)", textDecoration: "none" },
  sourceComma: { color: "var(--color-text-muted)" },
  thinking: {
    fontFamily: "var(--font-mono)",
    color: "var(--color-text-muted)",
    fontSize: 14,
  },
  inputBar: {
    borderTop: "1px solid var(--color-border)",
    padding: "16px 24px",
  },
  inputRow: { display: "flex", alignItems: "center", gap: 10 },
  prompt: {
    color: "var(--color-accent)",
    fontFamily: "var(--font-mono)",
    fontSize: 16,
  },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--color-text)",
    fontFamily: "var(--font-sans)",
    fontSize: 15,
    padding: "8px 0",
  },
};
