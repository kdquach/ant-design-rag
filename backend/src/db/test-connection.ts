import { pool } from "./connection";

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("Kết nối thành công. Thời gian server:", result.rows[0].now);
  } catch (err) {
    console.error("Kết nối thất bại:", err);
  } finally {
    await pool.end();
  }
}

testConnection();
