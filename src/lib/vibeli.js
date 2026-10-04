// The Vibeli client for this app. The heavy session lifecycle (code exchange,
// silent refresh, token rotation) lives inside the SDK core — this module just
// constructs the client from the bootstrap config the vite-plugin injects
// (appId / gatewayUrl / contractVersion). Import `vibeli` anywhere you need data,
// auth, functions, realtime or integrations.
//
// NOTE: createClient() throws if appId/gatewayUrl are missing. src/main.jsx guards
// on the bootstrap config and only loads the app (and therefore this module) once
// it's present, so a misconfig shows a clear notice instead of a blank screen.
import { createClient } from "@vibeli/sdk";
import bootstrap from "virtual:vibeli/bootstrap";

/**
 * `entities` is typed by codegen (`./.vibeli/types.d.ts`): this binds the client's
 * entities map to the generated `VibeliEntities`, so the design invariants fire at
 * COMPILE time in this app — writing a server field (`created_by`) or filtering a
 * non-filterable field won't type-check (SDK invariants 6/7).
 * @type {import("@vibeli/sdk").VibeliBrowserClient<import("../../.vibeli/types").VibeliEntities>}
 */
export const vibeli = createClient(bootstrap);

// Convenience re-exports for app code.
export const { entities, auth, functions, integrations, realtime } = vibeli;

// The one error the SDK ever throws — re-exported here so app code catches it
// from the same module it reads data with, without a second import. Discriminate
// by `code` ('not_found' | 'validation' | 'rate_limited' | …), never by message.
export { VibeliError } from "@vibeli/sdk";
