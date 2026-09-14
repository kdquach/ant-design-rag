# Ant Design RAG Assistant

Trợ lý hỏi-đáp dựa trên tài liệu chính thức của Ant Design, sử dụng kiến trúc RAG (Retrieval-Augmented Generation) để trả lời câu hỏi kèm trích dẫn nguồn, thay vì dựa vào kiến thức có sẵn của LLM (dễ lỗi thời hoặc bịa đặt).

## Kiến trúc

- **Ingestion**: crawl docs Ant Design → chunk theo section → embed local (`all-MiniLM-L6-v2`, 384 chiều, chạy qua `@xenova/transformers`, không tốn phí API) → lưu vào PostgreSQL (Neon) với extension `pgvector`
- **Retrieval**: embed câu hỏi, tìm top-5 chunk gần nhất bằng cosine similarity (exact search, xem lý do không dùng ANN index ở phần dưới)
- **Generation**: ghép context vào prompt, gọi Gemini 3.6 Flash để sinh câu trả lời kèm nguồn trích dẫn, với chỉ dẫn rõ ràng để từ chối trả lời khi thông tin không có trong tài liệu

## Kết quả đánh giá

**Retrieval accuracy**: **91.7%** (22/24 câu hỏi thực tế về các component phổ biến — Table, Form, Modal, Button, Select, DatePicker, Upload, Drawer, Tooltip, Notification, Card, Steps, Pagination, Cascader...), đo bằng tỷ lệ component đúng nằm trong top-5 kết quả retrieval.

2 câu sai đều liên quan đến chủ đề theme/dark mode (`"custom theme màu sắc"`, `"Ant Design có hỗ trợ dark mode không?"`) — nguyên nhân nhiều khả năng là khoảng cách từ vựng giữa cách người dùng hỏi và cách docs viết (docs dùng thuật ngữ kỹ thuật như "algorithm", "token" thay vì "dark mode"), một giới hạn tự nhiên của embedding search theo similarity thuần túy, không phải lỗi hệ thống.

**Chống hallucination**: test với 3 câu hỏi về tính năng không tồn tại trong Ant Design (export Excel trực tiếp từ Table, animation confetti trên Button, tích hợp thanh toán online) — hệ thống từ chối đúng cả 3/3 câu, không bịa ra câu trả lời sai, dù retrieval vẫn trả về các component có liên quan gần nhất làm ngữ cảnh.

## Một vấn đề kỹ thuật đáng chú ý đã gặp và cách giải quyết

Trong quá trình đo retrieval accuracy, kết quả ban đầu dao động bất thường (từ 40% xuống 20%) dù không thay đổi dữ liệu hay logic embedding. Debug bằng cách thêm log số dòng trả về ở từng query, phát hiện: với cùng `LIMIT 5`, có truy vấn trả về 0 dòng, có truy vấn trả về đủ 5 — bất thường vì bảng có 423 dòng, không có lý do hợp lệ để trả về ít hơn 5.

Nguyên nhân: index `ivfflat` trên cột `embedding` là loại index **xấp xỉ** (approximate nearest neighbor) — nó chia dữ liệu thành các cụm (lists) và mặc định chỉ quét 1 cụm gần nhất thay vì toàn bộ bảng. Với dataset nhỏ (423 dòng), số cụm được tạo ra không cân đối với lượng dữ liệu, khiến nhiều truy vấn rơi vào cụm gần như trống.

**Giải pháp**: bỏ index `ivfflat`, để PostgreSQL quét tuần tự (sequential scan) toàn bộ bảng khi tính khoảng cách vector. Với quy mô dữ liệu này, cách này vừa **nhanh hơn** vừa **chính xác tuyệt đối** so với ANN index — index xấp xỉ chỉ thật sự có lợi khi dữ liệu đạt quy mô hàng chục nghìn dòng trở lên, nơi việc đánh đổi độ chính xác lấy tốc độ mới có ý nghĩa.

Bài học rút ra: hiểu rõ trade-off của các kỹ thuật tối ưu (index, approximate search...) quan trọng hơn việc áp dụng chúng theo mặc định — một tối ưu hóa "chuẩn" trên giấy có thể phản tác dụng nếu áp sai vào quy mô dữ liệu thực tế.

## Tech stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL + pgvector (Neon, serverless)
- **Embedding**: `all-MiniLM-L6-v2` qua `@xenova/transformers` (chạy local, miễn phí)
- **LLM**: Gemini 3.6 Flash (Interactions API)
- **Frontend**: React, Vite, Ant Design

## Chạy thử

\`\`\`bash

# Clone repo

git clone <repo-url>
cd ant-design-rag

# Cài backend

cd backend
npm install
cp .env.example .env # điền DATABASE_URL và GEMINI_API_KEY

# Nạp dữ liệu (chạy 1 lần)

npx tsx src/ingestion/embed-and-seed.ts

# Chạy server

npx tsx src/index.ts

# Chạy eval (tùy chọn)

npx tsx ../eval/run-eval.ts
\`\`\`
