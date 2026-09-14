import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat";

dotenv.config();

const app = express();
app.use(cors()); // thêm dòng này
app.use(express.json());
app.use("/api", chatRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server chạy ở port ${PORT}`));
