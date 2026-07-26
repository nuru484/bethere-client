// scripts/copy-mediapipe-wasm.mjs
//
// Stages the MediaPipe wasm runtime from node_modules into public/ so the
// guided liveness capture can load it same-origin (the production CSP blocks
// CDN fetches). Runs in prebuild AND dev (predev) so the files always match
// the installed @mediapipe/tasks-vision version; the directory is
// gitignored - only the .task model (which has no npm source) is committed.
import { cp, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const target = join(root, "public/models/mediapipe/wasm");

await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
console.log("copy-mediapipe-wasm: staged wasm runtime into public/models/mediapipe/wasm");
