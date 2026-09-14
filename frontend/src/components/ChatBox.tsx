import { useState, useRef, useEffect } from "react";
import { Input, Button, Spin, Card } from "antd";
import { SendOutlined } from "@ant-design/icons";
import axios from "axios";
import type { Message } from "../types";
import SourceCitation from "./SourceCitation";
import ReactMarkdown from "react-markdown";

export default function ChatBox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "";
      const res = await axios.post(`${API_URL}/api/chat`, { question });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.data.answer,
          sources: res.data.sources,
        },
      ]);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Có lỗi xảy ra, thử lại sau." },
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
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      <h2>Ant Design Docs Assistant</h2>
      <p style={{ color: "#888", fontSize: 13 }}>
        Hỏi bất kỳ điều gì về component Ant Design — trả lời dựa trên docs chính
        thức.
      </p>

      <div
        style={{
          minHeight: 400,
          maxHeight: 500,
          overflowY: "auto",
          marginBottom: 16,
        }}
      >
        {messages.map((m, i) => (
          <Card
            key={i}
            size="small"
            style={{
              marginBottom: 8,
              marginLeft: m.role === "user" ? 80 : 0,
              marginRight: m.role === "assistant" ? 80 : 0,
              background: m.role === "user" ? "#e6f4ff" : "#fff",
            }}
          >
            <div className="markdown-content">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
            {m.sources && <SourceCitation sources={m.sources} />}
          </Card>
        ))}
        {loading && <Spin size="small" style={{ margin: 8 }} />}
        <div ref={bottomRef} />
      </div>

      <Input.Group compact style={{ display: "flex" }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="vd. Table có hỗ trợ pagination không?"
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
        >
          Gửi
        </Button>
      </Input.Group>
    </div>
  );
}
