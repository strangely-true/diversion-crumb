const req = {
  json: async () => ({
    message: { type: "tool-calls", toolCallList: [{ id: "123", type: "function", function: { name: "listProducts", arguments: "{}" } }] }
  })
}
const headers = new Map();
req.headers = headers;

import('./app/api/vapi/tools/route.ts').then(m => m.POST(req)).then(r => console.log(r)).catch(console.error);
