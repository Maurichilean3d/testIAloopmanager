import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Code2,
  Download,
  FileText,
  FolderArchive,
  LayoutGrid,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  RefreshCcw,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import {
  ArchitectResponse,
  CanvasField,
  CompiledFile,
  DecisionItem,
  DecisionStatus,
  FieldStatus,
  Message,
  ProjectMaturity,
  ProjectModel,
  ScopeLevel,
} from "./types";
import {
  createEmptyProjectModel,
  FieldPath,
  maturityLabel,
  maturityOrder,
  nowIso,
} from "./model";

const STORAGE_KEY = "cognitive-systems-canvas-v1";

const DEFAULT_GREETING = `Hola. Soy tu **Arquitecto IA**.

Voy a ayudarte a convertir una necesidad en un proyecto delimitado, verificable y listo para un agente de código. Primero inferiré lo que sea razonable; solo preguntaré cuando falte una decisión crítica.

**¿Qué quieres construir y qué resultado debería existir al terminar la primera versión?**`;

const COMPILERS = [
  { id: "antigravity", name: "Antigravity", icon: CircleDot },
  { id: "claude_code", name: "Claude Code", icon: Terminal },
  { id: "codex", name: "Codex", icon: Terminal },
  { id: "cursor", name: "Cursor", icon: Code2 },
];

const FIELD_LABELS: Record<FieldPath, string> = {
  "metadata.name": "Nombre del proyecto",
  "metadata.summary": "Resumen",
  "metadata.professionProfile": "Perfil profesional",
  "metadata.targetEnvironment": "Entorno de destino",
  "discovery.problem": "¿Qué quieres resolver?",
  "discovery.users": "¿Para quién es?",
  "discovery.outcome": "¿Qué debe existir al finalizar?",
  "discovery.rationale": "¿Por qué importa?",
  "scope.mvp": "MVP: lo que construiremos ahora",
  "scope.outOfScope": "Fuera de alcance",
  "scope.futureVision": "Visión futura",
  "context.knowledgeSources": "Conocimiento y fuentes",
  "context.constraints": "Restricciones",
  "context.glossary": "Glosario del dominio",
  "context.assumptions": "Supuestos",
  "context.ambiguityRules": "Reglas ante ambigüedad",
  "architecture.capabilities": "Capacidades necesarias",
  "architecture.tools": "Herramientas y stack",
  "architecture.systemShape": "Forma general del sistema",
  "architecture.integrations": "Integraciones",
  "architecture.dataAndMemory": "Datos y memoria",
  "loops.developmentLoop": "Development Loop",
  "loops.runtimeLoop": "Runtime Loop",
  "loops.improvementLoop": "Improvement Loop",
  "loops.humanApproval": "Aprobación humana",
  "loops.stopConditions": "Condiciones de detención",
  "harness.successCriteria": "Criterios de éxito",
  "harness.acceptanceCriteria": "Criterios de aceptación",
  "harness.qualityGates": "Quality Gates",
  "harness.testStrategy": "Estrategia de pruebas",
  "harness.nonFunctionalLimits": "Límites no funcionales",
  "delivery.deliverables": "Entregables",
  "delivery.implementationPlan": "Plan de implementación",
  "delivery.repositoryShape": "Estructura del repositorio",
};

const FIELD_HELP: Partial<Record<FieldPath, string>> = {
  "scope.mvp": "La versión mínima que demuestra valor. Evita incluir la visión completa.",
  "scope.outOfScope": "Todo lo que el agente no debe implementar en esta iteración.",
  "context.ambiguityRules": "Cuándo el agente debe detenerse, proponer opciones o pedir aprobación.",
  "loops.developmentLoop": "Cómo trabajará el agente: leer, planificar, implementar, validar y detenerse.",
  "loops.runtimeLoop": "Cómo opera el producto. Déjalo explícitamente como no requerido si es software determinista.",
  "harness.qualityGates": "Comprobaciones que bloquean una entrega defectuosa.",
  "harness.acceptanceCriteria": "Resultados observables y verificables del MVP.",
};

function cloneModel(model: ProjectModel): ProjectModel {
  return JSON.parse(JSON.stringify(model));
}

function getField(model: ProjectModel, path: FieldPath): CanvasField {
  const [section, key] = path.split(".") as [keyof ProjectModel, string];
  return (model[section] as any)[key] as CanvasField;
}

function setField(model: ProjectModel, path: FieldPath, field: CanvasField): ProjectModel {
  const next = cloneModel(model);
  const [section, key] = path.split(".") as [keyof ProjectModel, string];
  (next[section] as any)[key] = field;
  next.metadata.updatedAt = nowIso();
  return next;
}

function sourceLabel(field: CanvasField) {
  if (field.source === "user") return "Usuario";
  if (field.source === "architect") return "Inferido";
  return "Pendiente";
}

function statusClass(status: FieldStatus) {
  if (status === "approved" || status === "frozen") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "pending") return "bg-amber-50 text-amber-700 border-amber-200";
  if (status === "rejected") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-50 text-slate-500 border-slate-200";
}

function FieldCard({
  model,
  path,
  onChange,
  className = "",
  minRows = 4,
}: {
  model: ProjectModel;
  path: FieldPath;
  onChange: (path: FieldPath, field: CanvasField) => void;
  className?: string;
  minRows?: number;
}) {
  const field = getField(model, path);
  const approve = () => onChange(path, { ...field, status: "approved", updatedAt: nowIso() });
  const reject = () => onChange(path, { ...field, status: "rejected", updatedAt: nowIso() });

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{FIELD_LABELS[path]}</h3>
          {FIELD_HELP[path] && <p className="mt-1 text-xs leading-relaxed text-slate-500">{FIELD_HELP[path]}</p>}
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusClass(field.status)}`}>
          {sourceLabel(field)} · {field.status}
        </span>
      </div>
      <textarea
        value={field.value}
        rows={minRows}
        placeholder="Aún no definido"
        onChange={(event) =>
          onChange(path, {
            ...field,
            value: event.target.value,
            source: "user",
            status: "approved",
            confidence: 1,
            updatedAt: nowIso(),
          })
        }
        className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-sm leading-relaxed text-slate-800 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
      />
      {field.source === "architect" && field.status === "pending" && (
        <div className="mt-3 flex gap-2">
          <button onClick={approve} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
            <Check className="h-3.5 w-3.5" /> Aprobar
          </button>
          <button onClick={reject} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <X className="h-3.5 w-3.5" /> Rechazar
          </button>
        </div>
      )}
    </section>
  );
}

function MarkdownText({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {content.split("\n\n").map((paragraph, index) => (
        <p key={`${paragraph}-${index}`}>
          {paragraph.split("**").map((part, partIndex) =>
            partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part,
          )}
        </p>
      ))}
    </div>
  );
}

export default function App() {
  const [model, setModel] = useState<ProjectModel>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : createEmptyProjectModel();
    } catch {
      return createEmptyProjectModel();
    }
  });
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "model", content: DEFAULT_GREETING, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const [activeView, setActiveView] = useState<"canvas" | "engineering" | "decisions" | "compile">("canvas");
  const [showChat, setShowChat] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.35);
  const [maxTokens, setMaxTokens] = useState(3500);
  const [targetCompiler, setTargetCompiler] = useState("antigravity");
  const [previewFiles, setPreviewFiles] = useState<CompiledFile[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string>("");
  const [compiling, setCompiling] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
  }, [model]);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data) => setAiConfigured(Boolean(data.aiConfigured)))
      .catch(() => setAiConfigured(false));
  }, []);

  useEffect(() => {
    if (showChat) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showChat]);

  const readiness = useMemo(() => {
    const required: FieldPath[] = [
      "metadata.name",
      "discovery.problem",
      "discovery.users",
      "discovery.outcome",
      "scope.mvp",
      "scope.outOfScope",
      "context.constraints",
      "context.ambiguityRules",
      "architecture.systemShape",
      "loops.developmentLoop",
      "harness.acceptanceCriteria",
      "harness.testStrategy",
      "delivery.implementationPlan",
    ];
    const approvedCount = required.filter((path) => {
      const field = getField(model, path);
      return field.value.trim() && (field.status === "approved" || field.status === "frozen");
    }).length;
    const pending = required.filter((path) => getField(model, path).status === "pending").length;
    return {
      score: Math.round((approvedCount / required.length) * 100),
      approvedCount,
      total: required.length,
      pending,
      missing: required.filter((path) => !getField(model, path).value.trim()),
    };
  }, [model]);

  const updateField = (path: FieldPath, field: CanvasField) => setModel((current) => setField(current, path, field));

  const applyArchitectResponse = (data: ArchitectResponse) => {
    setModel((current) => {
      let next = cloneModel(current);
      for (const update of data.updates || []) {
        const path = update.path as FieldPath;
        try {
          const existing = getField(next, path);
          if (existing.source === "user" && existing.status === "approved" && existing.value.trim()) continue;
          next = setField(next, path, {
            value: update.value,
            source: "architect",
            status: "pending",
            confidence: update.confidence,
            updatedAt: nowIso(),
          });
        } catch {
          // El servidor ya filtra rutas; ignorar cualquier ruta inesperada.
        }
      }

      const known = new Set(next.decisions.map((item) => item.id));
      const proposals = (data.proposals || []).filter((item) => !known.has(item.id));
      next.decisions = [...next.decisions, ...proposals];
      next.maturity = data.maturity;
      next.metadata.updatedAt = nowIso();
      return next;
    });
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || loading) return;
    setInput("");
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, projectModel: model, temperature, maxTokens }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible consultar al Arquitecto IA.");
      applyArchitectResponse(data);
      setMessages((current) => [
        ...current,
        {
          id: `model-${Date.now()}`,
          role: "model",
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: "model",
          content: `No pude procesar la solicitud: ${error.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateDecision = (id: string, patch: Partial<DecisionItem>) => {
    setModel((current) => ({
      ...current,
      metadata: { ...current.metadata, updatedAt: nowIso() },
      decisions: current.decisions.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const previewCompilation = async () => {
    setCompiling(true);
    try {
      const response = await fetch("/api/compile/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectModel: model, targetAgent: targetCompiler }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible generar la vista previa.");
      setPreviewFiles(data.files || []);
      setSelectedPreview(data.files?.[0]?.filename || "");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCompiling(false);
    }
  };

  const downloadCompilation = async () => {
    setCompiling(true);
    try {
      const response = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectModel: model, targetAgent: targetCompiler }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No fue posible compilar el ZIP.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${model.metadata.name.value || "project"}_${targetCompiler}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setCompiling(false);
    }
  };

  const reset = () => {
    if (!confirm("¿Reiniciar el Canvas y borrar el estado local?")) return;
    const empty = createEmptyProjectModel();
    setModel(empty);
    setMessages([{ id: "welcome-reset", role: "model", content: DEFAULT_GREETING, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setPreviewFiles([]);
    setActiveView("canvas");
  };

  const selectedFile = previewFiles.find((file) => file.filename === selectedPreview);
  const pendingDecisions = model.decisions.filter((item) => item.status === "proposed").length;
  const maturityIndex = maturityOrder.indexOf(model.maturity);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight">Cognitive Systems Canvas</h1>
              <p className="text-xs text-slate-500">Canvas → Project Model → Engineering Compiler</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`hidden rounded-full border px-3 py-1 text-xs font-semibold md:block ${aiConfigured ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
              {aiConfigured === null ? "Comprobando IA" : aiConfigured ? "Arquitecto en línea" : "Falta clave del servidor"}
            </div>
            <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <RefreshCcw className="h-4 w-4" /> Reiniciar
            </button>
            {!showChat && (
              <button onClick={() => setShowChat(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                <PanelRightOpen className="h-4 w-4" /> Conversación
              </button>
            )}
          </div>
        </header>

        <nav className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2">
          {[
            { id: "canvas", label: "Canvas", icon: LayoutGrid },
            { id: "engineering", label: "Context · Loops · Harness", icon: ShieldCheck },
            { id: "decisions", label: `Decisiones${pendingDecisions ? ` (${pendingDecisions})` : ""}`, icon: Check },
            { id: "compile", label: "Compilar proyecto", icon: FolderArchive },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as typeof activeView)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeView === item.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </button>
            );
          })}
          <div className="ml-auto hidden items-center gap-2 px-3 text-xs text-slate-500 lg:flex">
            <span>{maturityLabel[model.maturity]}</span>
            <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-blue-600" style={{ width: `${((maturityIndex + 1) / maturityOrder.length) * 100}%` }} />
            </div>
          </div>
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-7">
          {activeView === "canvas" && (
            <div className="mx-auto max-w-7xl space-y-5">
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Canvas metodológico</h2>
                  <p className="mt-1 text-sm text-slate-500">La conversación alimenta este modelo. Tú apruebas lo inferido antes de compilar.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-900">Preparación:</span> {readiness.score}% · {readiness.approvedCount}/{readiness.total} campos críticos
                </div>
              </div>

              <div className="grid auto-rows-min grid-cols-1 gap-4 lg:grid-cols-12">
                <FieldCard model={model} path="metadata.name" onChange={updateField} className="lg:col-span-4" minRows={2} />
                <FieldCard model={model} path="discovery.problem" onChange={updateField} className="lg:col-span-5 lg:row-span-2" minRows={7} />
                <FieldCard model={model} path="discovery.users" onChange={updateField} className="lg:col-span-3" minRows={3} />
                <FieldCard model={model} path="discovery.rationale" onChange={updateField} className="lg:col-span-4" minRows={3} />
                <FieldCard model={model} path="discovery.outcome" onChange={updateField} className="lg:col-span-3" minRows={4} />

                <FieldCard model={model} path="context.knowledgeSources" onChange={updateField} className="lg:col-span-3" minRows={5} />
                <FieldCard model={model} path="architecture.capabilities" onChange={updateField} className="lg:col-span-3" minRows={5} />
                <FieldCard model={model} path="scope.mvp" onChange={updateField} className="lg:col-span-6" minRows={5} />

                <FieldCard model={model} path="context.constraints" onChange={updateField} className="lg:col-span-3" minRows={5} />
                <FieldCard model={model} path="architecture.tools" onChange={updateField} className="lg:col-span-3" minRows={5} />
                <FieldCard model={model} path="scope.outOfScope" onChange={updateField} className="lg:col-span-3" minRows={5} />
                <FieldCard model={model} path="scope.futureVision" onChange={updateField} className="lg:col-span-3" minRows={5} />

                <FieldCard model={model} path="harness.successCriteria" onChange={updateField} className="lg:col-span-4" minRows={4} />
                <FieldCard model={model} path="metadata.professionProfile" onChange={updateField} className="lg:col-span-4" minRows={4} />
                <FieldCard model={model} path="metadata.targetEnvironment" onChange={updateField} className="lg:col-span-4" minRows={4} />
              </div>
            </div>
          )}

          {activeView === "engineering" && (
            <div className="mx-auto max-w-7xl space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Ingeniería del proyecto</h2>
                <p className="mt-1 text-sm text-slate-500">Context Engineering, Loop Engineering y Harness Engineering se diseñan aquí antes de exportarse.</p>
              </div>

              <section>
                <div className="mb-3 flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /><h3 className="text-lg font-bold">Context Engineering</h3></div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <FieldCard model={model} path="context.glossary" onChange={updateField} />
                  <FieldCard model={model} path="context.assumptions" onChange={updateField} />
                  <FieldCard model={model} path="context.ambiguityRules" onChange={updateField} />
                  <FieldCard model={model} path="architecture.systemShape" onChange={updateField} />
                  <FieldCard model={model} path="architecture.integrations" onChange={updateField} />
                  <FieldCard model={model} path="architecture.dataAndMemory" onChange={updateField} />
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2"><RefreshCcw className="h-5 w-5 text-violet-600" /><h3 className="text-lg font-bold">Loop Engineering</h3></div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <FieldCard model={model} path="loops.developmentLoop" onChange={updateField} />
                  <FieldCard model={model} path="loops.runtimeLoop" onChange={updateField} />
                  <FieldCard model={model} path="loops.improvementLoop" onChange={updateField} />
                  <FieldCard model={model} path="loops.humanApproval" onChange={updateField} />
                  <FieldCard model={model} path="loops.stopConditions" onChange={updateField} />
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h3 className="text-lg font-bold">Harness Engineering</h3></div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <FieldCard model={model} path="harness.acceptanceCriteria" onChange={updateField} />
                  <FieldCard model={model} path="harness.testStrategy" onChange={updateField} />
                  <FieldCard model={model} path="harness.qualityGates" onChange={updateField} />
                  <FieldCard model={model} path="harness.nonFunctionalLimits" onChange={updateField} />
                  <FieldCard model={model} path="delivery.deliverables" onChange={updateField} />
                  <FieldCard model={model} path="delivery.implementationPlan" onChange={updateField} />
                  <FieldCard model={model} path="delivery.repositoryShape" onChange={updateField} />
                </div>
              </section>
            </div>
          )}

          {activeView === "decisions" && (
            <div className="mx-auto max-w-5xl space-y-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Decisiones y trazabilidad</h2>
                <p className="mt-1 text-sm text-slate-500">Lo inferido nunca queda aprobado de forma automática.</p>
              </div>
              {model.decisions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
                  <Check className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  El Arquitecto aún no ha propuesto decisiones.
                </div>
              ) : (
                <div className="space-y-3">
                  {model.decisions.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">{item.title}</h3>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500">{item.category}</span>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.scope === "mvp" ? "bg-blue-50 text-blue-700" : item.scope === "future" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}`}>{item.scope}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{item.description}</p>
                          <p className="mt-2 text-xs text-slate-500"><strong>Justificación:</strong> {item.rationale}</p>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <select value={item.scope} onChange={(event) => updateDecision(item.id, { scope: event.target.value as ScopeLevel })} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold">
                            <option value="mvp">MVP</option>
                            <option value="future">Futuro</option>
                            <option value="out">Fuera</option>
                          </select>
                          <select value={item.status} onChange={(event) => updateDecision(item.id, { status: event.target.value as DecisionStatus })} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold">
                            <option value="proposed">Propuesta</option>
                            <option value="approved">Aprobada</option>
                            <option value="rejected">Rechazada</option>
                            <option value="frozen">Congelada</option>
                          </select>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeView === "compile" && (
            <div className="mx-auto max-w-7xl space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Compilar proyecto</h2>
                <p className="mt-1 text-sm text-slate-500">La exportación es determinista: los archivos se generan desde el Project Model aprobado, no desde una improvisación final del LLM.</p>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="font-bold">Preparación</h3>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border-8 border-slate-100 text-xl font-black text-slate-900">{readiness.score}%</div>
                    <div className="text-sm text-slate-600">
                      <p>{readiness.approvedCount} de {readiness.total} campos críticos aprobados.</p>
                      <p className="mt-1">{pendingDecisions} decisiones pendientes.</p>
                    </div>
                  </div>
                  {readiness.missing.length > 0 && (
                    <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                      <strong>Falta definir:</strong> {readiness.missing.slice(0, 4).map((path) => FIELD_LABELS[path]).join(", ")}{readiness.missing.length > 4 ? "…" : ""}
                    </div>
                  )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                  <h3 className="font-bold">Perfil de destino</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {COMPILERS.map((compiler) => {
                      const Icon = compiler.icon;
                      return (
                        <button key={compiler.id} onClick={() => setTargetCompiler(compiler.id)} className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${targetCompiler === compiler.id ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:bg-slate-50"}`}>
                          <Icon className="h-5 w-5 text-slate-600" />
                          <div><p className="text-sm font-bold">{compiler.name}</p><p className="text-xs text-slate-500">Genera reglas y punto de entrada adaptados</p></div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>

              <div className="flex flex-wrap gap-3">
                <button onClick={previewCompilation} disabled={compiling} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                  <FileText className="h-4 w-4" /> Vista previa
                </button>
                <button onClick={downloadCompilation} disabled={compiling} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50">
                  {compiling ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Descargar ZIP
                </button>
              </div>

              {previewFiles.length > 0 && (
                <div className="grid min-h-[520px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[300px_1fr]">
                  <aside className="border-b border-slate-200 bg-slate-50 p-3 lg:border-b-0 lg:border-r">
                    <p className="px-2 py-2 text-xs font-bold uppercase tracking-wide text-slate-500">{previewFiles.length} archivos</p>
                    <div className="space-y-1">
                      {previewFiles.map((file) => (
                        <button key={file.filename} onClick={() => setSelectedPreview(file.filename)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition ${selectedPreview === file.filename ? "bg-white font-bold text-blue-700 shadow-sm" : "text-slate-600 hover:bg-white"}`}>
                          <FileText className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{file.filename}</span>
                        </button>
                      ))}
                    </div>
                  </aside>
                  <section className="min-w-0 p-5">
                    {selectedFile && (
                      <>
                        <div className="mb-4 border-b border-slate-200 pb-3"><h3 className="font-bold">{selectedFile.filename}</h3><p className="text-xs text-slate-500">{selectedFile.purpose}</p></div>
                        <pre className="max-h-[430px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-100">{selectedFile.content}</pre>
                      </>
                    )}
                  </section>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {showChat && (
        <aside className="relative flex w-[390px] shrink-0 flex-col border-l border-slate-200 bg-white shadow-[-12px_0_30px_rgba(15,23,42,0.04)]">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white"><Bot className="h-4 w-4" /><span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${aiConfigured ? "bg-emerald-500" : "bg-amber-500"}`} /></div>
              <div><h2 className="text-sm font-bold">Arquitecto IA</h2><p className="text-[11px] text-slate-500">Inferir · delimitar · validar</p></div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setShowSettings((value) => !value)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Settings2 className="h-4 w-4" /></button>
              <button onClick={() => setShowChat(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><PanelRightClose className="h-4 w-4" /></button>
            </div>
          </header>

          {showSettings && (
            <div className="absolute left-0 right-0 top-16 z-20 border-b border-slate-200 bg-white p-4 shadow-lg">
              <label className="block text-xs font-bold text-slate-700">Temperatura: {temperature}</label>
              <input className="mt-2 w-full" type="range" min="0" max="0.8" step="0.05" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} />
              <label className="mt-4 block text-xs font-bold text-slate-700">Tokens máximos: {maxTokens}</label>
              <input className="mt-2 w-full" type="range" min="1500" max="8000" step="500" value={maxTokens} onChange={(event) => setMaxTokens(Number(event.target.value))} />
            </div>
          )}

          {!aiConfigured && aiConfigured !== null && (
            <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
              <div className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>La compilación funciona, pero el chat requiere <code>OPENAI_API_KEY</code> en el servidor.</span></div>
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <div key={message.id} className={`max-w-[92%] ${message.role === "user" ? "ml-auto" : "mr-auto"}`}>
                <div className={`rounded-2xl px-4 py-3 ${message.role === "user" ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md bg-slate-100 text-slate-800"}`}>
                  <MarkdownText content={message.content} />
                </div>
                <p className={`mt-1 text-[10px] text-slate-400 ${message.role === "user" ? "text-right" : "text-left"}`}>{message.timestamp}</p>
              </div>
            ))}
            {loading && <div className="inline-flex items-center gap-2 rounded-2xl rounded-bl-md bg-slate-100 px-4 py-3 text-xs text-slate-500"><RefreshCcw className="h-3.5 w-3.5 animate-spin" /> Analizando el modelo…</div>}
            <div ref={chatEndRef} />
          </div>

          <div className="shrink-0 border-t border-slate-200 p-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-1 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-100">
              <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} rows={3} placeholder="Describe, corrige o aprueba una decisión…" className="w-full resize-none bg-transparent px-3 py-2 text-sm outline-none" />
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-[10px] text-slate-400">Enter para enviar · Shift+Enter para salto</span>
                <button onClick={sendMessage} disabled={!input.trim() || loading || !aiConfigured} className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"><Send className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
