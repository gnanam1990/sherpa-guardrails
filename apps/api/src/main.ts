import { createApiServer } from "./server.js";

const port = Number(process.env.PORT ?? "8787");

createApiServer().listen(port, () => {
  console.log(`Sherpa API listening on http://localhost:${port}`);
});
