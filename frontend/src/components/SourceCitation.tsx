import { Tag } from "antd";
import type { Source } from "../types";

interface Props {
  sources: Source[];
}

export default function SourceCitation({ sources }: Props) {
  if (!sources || sources.length === 0) return null;

  // loại bỏ trùng lặp component (vd. table xuất hiện 2 lần trong top-5)
  const uniqueSources = Array.from(
    new Map(sources.map((s) => [s.component, s])).values(),
  );

  return (
    <div style={{ marginTop: 8 }}>
      <span style={{ fontSize: 12, color: "#888", marginRight: 8 }}>
        Nguồn:
      </span>
      {uniqueSources.map((s) => (
        <Tag key={s.component}>
          <a href={s.url} target="_blank" rel="noopener noreferrer">
            {s.component}
          </a>
        </Tag>
      ))}
    </div>
  );
}
