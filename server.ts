import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import JSZip from "jszip";
import { buildProjectFiles } from "./compiler/projectCompiler";
import { fieldPaths } from "./src/model";
import type { ProjectModel } from "./src/types";

dotenv.config({ path: process.env.NODE_ENV === "production" ? ".env" : ".env.local" });
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const apiKey = process.env.OPENAI_API_KEY?.trim();
const openai = apiKey ? new OpenAI({ apiKey }) : null;

app.disable("x-powered-by");
app.use(express.json({ limit: "5mb" }));

const allowedPaths = new Set<string>(fieldPaths);

function safeNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function safeFilename(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "project";
}

function requireProjectModel(value: unknown): ProjectModel {
  if (!value || typeof value !== "object") {
    throw new Error("El Project Model es obligatorio.");
  }
  return value as ProjectModel;
}

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    aiConfigured: Boolean(openai),
    model: OPENAI_MODEL,
    compiler: "deterministic-v1",
  });
});

app.post("/api/compile/preview", (req, res) => {
  try {
    const model = requireProjectModel(req.body.projectModel);
    const targetAgent = String(req.body.targetAgent || "antigravity");
    const files = buildProjectFiles(model, targetAgent);
    res.json({ files });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "No fue posible generar la vista previa." });
  }
});

app.post("/api/compile", async (req, res) => {
  try {
    const model = requireProjectModel(req.body.projectModel);
    const targetAgent = String(req.body.targetAgent || "antigravity");
    const files = buildProjectFiles(model, targetAgent);
    const projectName = safeFilename(model.metadata?.name?.value || "project");

    const zip = new JSZip();
    const root = zip.folder(projectName);
    if (!root) throw new Error("No fue posible crear el paquete ZIP.");

    for (const file of files) {
      root.file(file.filename, file.content);
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${projectName}_${safeFilename(targetAgent)}.zip`,
    );
    res.send(zipBuffer);
  } catch (error: any) {
    console.error("Compilation error:", error.message);
    res.status(400).json({ error: error.message || "No fue posible compilar el proyecto." });
  }
});

app.post("/api/architect", async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: "Falta OPENAI_API_KEY en el entorno del servidor. La clave nunca debe incluirse en el frontend ni en el repositorio.",
      });
    }

    const projectModel = requireProjectModel(req.body.projectModel);
    const messages = Array.isArray(req.body.messages) ? req.body.messages.slice(-20) : [];
    const temperature = safeNumber(req.body.temperature, 0.35, 0, 1);
    const maxTokens = Math.round(safeNumber(req.body.maxTokens, 3500, 1000, 8000));

    const systemInstruction = `Eres el Arquitecto IA del Cognitive Systems Canvas.

MISIÓN
Transformar necesidades humanas en un Project Model trazable, minimalista, verificable y listo para compilar en Context Engineering, Loop Engineering y Harness Engineering.

NO ERES UN ENTREVISTADOR NI UN VENDEDOR DE TECNOLOGÍA.
Antes de preguntar, debes inferir y proponer. Haz como máximo una pregunta crítica por respuesta. Si puedes avanzar con una hipótesis reversible, declárala como propuesta pendiente y continúa.

PRINCIPIOS OBLIGATORIOS
1. KISS/YAGNI: define la solución mínima que demuestra valor.
2. Separa MVP, visión futura y fuera de alcance.
3. No agregues IA, RAG, MCP, GraphDB, agentes múltiples, aprendizaje automático, VR/AR, event buses o microservicios salvo necesidad demostrada.
4. Ninguna inferencia queda aprobada automáticamente. Las propuestas se entregan con status="proposed".
5. No reemplaces datos expresados por el usuario. Si un campo aprobado ya contiene información, solo sugiere cambios como propuesta.
6. Cada respuesta debe aportar arquitectura, delimitación, riesgo, criterio verificable o una decisión útil.
7. No inventes cifras, requisitos legales, compatibilidades ni métricas. Si faltan, márcalas como pendientes.
8. Distingue el loop del producto del development loop del agente.
9. El Harness debe definir evidencia y gates, no código de pruebas ficticio.
10. Devuelve únicamente JSON conforme al esquema.

RUTINA INTERNA
- Comprender la última intención.
- Detectar qué campos del Project Model pueden actualizarse con evidencia.
- Proponer como máximo 4 decisiones concretas y necesarias.
- Detectar sobrearquitectura y moverla a future/out.
- Evaluar madurez.
- Responder en español claro, sin elogios vacíos ni emojis excesivos.

RUTAS EDITABLES
${fieldPaths.join("\n")}

REGLA DE UPDATES
- Incluye solo cambios respaldados por la conversación.
- path debe ser una ruta editable exacta.
- value debe ser concreto y útil.
- confidence entre 0 y 1.
- Los updates se mostrarán como pendientes de aprobación si modifican arquitectura, loops, harness o delivery.

REGLA DE PROPOSALS
- source siempre "architect".
- status siempre "proposed".
- scope: "mvp", "future" u "out".
- category: "component", "technology", "risk", "assumption" o "decision".
- No más de 4 propuestas.
`;

    const conversation = messages
      .map((message: any) => `${message.role === "user" ? "Usuario" : "Arquitecto"}: ${String(message.content || "")}`)
      .join("\n");

    const userPrompt = `PROJECT MODEL ACTUAL:\n${JSON.stringify(projectModel, null, 2)}\n\nCONVERSACIÓN RECIENTE:\n${conversation}\n\nProcesa especialmente el último mensaje del usuario.`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature,
      max_completion_tokens: maxTokens,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cognitive_architect_response",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["response", "updates", "proposals", "maturity"],
            properties: {
              response: { type: "string" },
              maturity: {
                type: "string",
                enum: [
                  "idea",
                  "problem-understood",
                  "architecture-draft",
                  "mvp-defined",
                  "quality-defined",
                  "ready-to-compile",
                ],
              },
              updates: {
                type: "array",
                maxItems: 10,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["path", "value", "confidence", "reason"],
                  properties: {
                    path: { type: "string" },
                    value: { type: "string" },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    reason: { type: "string" },
                  },
                },
              },
              proposals: {
                type: "array",
                maxItems: 4,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "id",
                    "title",
                    "description",
                    "rationale",
                    "source",
                    "status",
                    "scope",
                    "category",
                    "confidence",
                    "createdAt",
                  ],
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    rationale: { type: "string" },
                    source: { type: "string", enum: ["architect"] },
                    status: { type: "string", enum: ["proposed"] },
                    scope: { type: "string", enum: ["mvp", "future", "out"] },
                    category: {
                      type: "string",
                      enum: ["component", "technology", "risk", "assumption", "decision"],
                    },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                    createdAt: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    });

    const output = response.choices[0]?.message?.content;
    if (!output) throw new Error("El modelo no devolvió una respuesta.");
    const parsed = JSON.parse(output);

    parsed.updates = (parsed.updates || []).filter(
      (update: any) => allowedPaths.has(update.path) && typeof update.value === "string" && update.value.trim(),
    );
    parsed.proposals = (parsed.proposals || []).map((proposal: any, index: number) => ({
      ...proposal,
      id: proposal.id || `proposal-${Date.now()}-${index}`,
      source: "architect",
      status: "proposed",
      createdAt: new Date().toISOString(),
    }));

    return res.json(parsed);
  } catch (error: any) {
    console.error("Architect error:", error.message);
    res.status(500).json({ error: error.message || "No fue posible procesar la conversación." });
  }
});

async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Cognitive Systems Canvas running on http://localhost:${PORT}`);
    if (!apiKey) console.warn("OPENAI_API_KEY is not configured; compilation works, chat is disabled.");
  });
}

bootstrap();
