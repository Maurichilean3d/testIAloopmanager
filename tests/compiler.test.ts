import assert from "node:assert/strict";
import test from "node:test";
import { buildProjectFiles } from "../compiler/projectCompiler";
import { createEmptyProjectModel, nowIso } from "../src/model";

function approved(value: string) {
  return { value, source: "user" as const, status: "approved" as const, confidence: 1, updatedAt: nowIso() };
}

test("compiler generates operational Context, Loop and Harness files", () => {
  const model = createEmptyProjectModel();
  model.metadata.name = approved("Blender City MVP");
  model.discovery.problem = approved("Generar una ciudad procedural simple en Blender.");
  model.discovery.users = approved("Artistas 3D.");
  model.discovery.outcome = approved("Un add-on instalable que genera calles y edificios básicos.");
  model.scope.mvp = approved("Generación local, determinista y configurable de una manzana.");
  model.scope.outOfScope = approved("Tráfico, peatones, IA y servicios externos.");
  model.loops.developmentLoop = approved("Implementar una tarea, ejecutar pruebas y validar criterios.");
  model.harness.acceptanceCriteria = approved("El add-on se registra y genera una manzana sin errores.");
  model.harness.testStrategy = approved("Pruebas de registro, operador y geometría mínima.");

  const files = buildProjectFiles(model, "antigravity");
  const names = new Set(files.map((file) => file.filename));

  assert(names.has("CONTEXT.md"));
  assert(names.has("loops/DEVELOPMENT_LOOP.md"));
  assert(names.has("harness/HARNESS_SPEC.md"));
  assert(names.has("harness/QUALITY_GATES.json"));
  assert(names.has("AGENTS.md"));

  const context = files.find((file) => file.filename === "CONTEXT.md")?.content || "";
  assert.match(context, /Generar una ciudad procedural simple/);
  assert.doesNotMatch(context, /GraphDB|VR\/AR|multiagente/i);
});

test("compiler never includes API keys", () => {
  const model = createEmptyProjectModel();
  model.metadata.name = approved("Safe Project");
  const output = buildProjectFiles(model, "codex").map((file) => file.content).join("\n");
  assert.doesNotMatch(output, /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/);
});
