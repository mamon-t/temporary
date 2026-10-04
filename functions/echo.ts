// Sample edge function (Deno) — demonstrates the server-side SDK (@vibeli/sdk
// design §5A, §8). Web-standards only: Deno.serve + Request/Response. Returns a
// business result as 2xx + body — including the "no" case (NEVER a non-2xx for a
// business outcome; non-2xx is reserved for infra failure, §8 convention).
//
// The deployed app pins an exact SDK version (§12); the registry is resolved via
// the functions import map (deno.json, §15).
import { createClientFromRequest } from "@vibeli/sdk/functions";
import type { Task } from "../.vibeli/types.d.ts";

Deno.serve(async (req: Request): Promise<Response> => {
  const vibeli = createClientFromRequest(req);
  const user = await vibeli.auth.me(); // caller identity (may be null — anonymous is valid)

  const { title } = (await req.json().catch(() => ({}))) as { title?: string };
  if (!title) {
    // Business "no" — still a 2xx with a body.
    return Response.json({ found: false, reason: "title is required" });
  }

  // As the caller (record permissions apply); use asServiceRole.* for full access.
  const page = await vibeli.entities.Task.filter({ title: { eq: title } }, { limit: 1 });
  const task = page.items[0] as Task | undefined;

  return Response.json({
    found: task !== undefined,
    caller: user?.email ?? null,
    task: task ?? null,
  });
});
