import { createClient } from "@libsql/client";
import { config } from "dotenv";
config();
async function main(){
  const db = createClient({ url: process.env.TURSO_URL||process.env.VITE_TURSO_URL||"", authToken: process.env.TURSO_AUTH_TOKEN||process.env.VITE_TURSO_AUTH_TOKEN||undefined });
  await db.execute("DELETE FROM orders WHERE id = 97 AND emp_name = 'Test Order'");
  const r = await db.execute("SELECT COALESCE(MAX(order_no),0) AS mx FROM orders WHERE vendor LIKE 'synergygroup%'");
  console.log("deleted test order 97; next paid order will be SG-" + (Number((r.rows[0] as any).mx)+1));
}
main().catch(e=>{console.error(e);process.exit(1);});
