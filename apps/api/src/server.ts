import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { parseJson, stringifyJson } from "./json.js";
import { handleApiRequest } from "./routes.js";

export function createApiServer() {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const body = await readRequestBody(request);
    const parsedBody = parseJson(body);
    const result = handleApiRequest(
      request.method ?? "GET",
      url.pathname,
      parsedBody,
    );

    sendJson(response, result.status, result.body);
  });
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
  });
  response.end(stringifyJson(body));
}
