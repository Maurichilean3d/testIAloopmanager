import type { CanvasField, CompiledFile, DecisionItem, ProjectModel } from "../src/types";

const text = (field: CanvasField, fallback = "Pendiente de definición y aprobación.") =>
  field.value.trim() || fallback;

const approved = (items: DecisionItem[], category?: DecisionItem["category"]) =>
  items.filter((item) => item.status === "approved" && (!category || item.category === category));

const pending = (items: DecisionItem[]) => items.filter((item) => item.status === "proposed");

const bullets = (value: string, fallback = "- Pendiente") => {
  const lines = value
    .split(/\n|;/)
    .map((line) => line.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean);
  return lines.length ? lines.map((line) => `- ${line}`).join("\n") : fallback;
};

const decisionTable = (items: DecisionItem[]) => {
  if (!items.length) return "| Estado | Decisión | Alcance | Justificación |\n|---|---|---|---|\n| Pendiente | Sin decisiones registradas | — | Debe resolverse durante el diseño |";
  return [
    "| Estado | Decisión | Alcance | Justificación |",
    "|---|---|---|---|",
    ...items.map((item) => `| ${item.status} | ${item.title} | ${item.scope} | ${item.rationale || item.description} |`),
  ].join("\n");
};

const targetInstructions = (target: string) => {
  const normalized = target.toLowerCase();
  if (normalized === "claude_code") {
    return {
      filename: "CLAUDE.md",
      title: "Directivas para Claude Code",
      notes: "Lee primero CONTEXT.md, MVP_SCOPE.md y IMPLEMENTATION_PLAN.md. Implementa una tarea pequeña por vez y ejecuta los gates definidos en harness/QUALITY_GATES.json.",
    };
  }
  if (normalized === "cursor") {
    return {
      filename: ".cursor/rules/project.mdc",
      title: "Reglas para Cursor",
      notes: "Mantén el alcance del MVP. Usa los documentos de contexto como fuente de verdad y no incorpores dependencias no aprobadas.",
    };
  }
  if (normalized === "codex") {
    return {
      filename: "AGENTS.md",
      title: "Directivas para Codex",
      notes: "Antes de editar, presenta un plan breve. No avances si una decisión crítica está pendiente. Ejecuta pruebas y registra decisiones nuevas.",
    };
  }
  return {
    filename: "AGENTS.md",
    title: "Directivas para Antigravity",
    notes: "Trabaja únicamente dentro del MVP aprobado. Lee los archivos en el orden indicado, implementa una unidad pequeña, valida y solicita aprobación humana en los puntos definidos.",
  };
};

export function buildProjectFiles(model: ProjectModel, targetAgent = "antigravity"): CompiledFile[] {
  const projectName = text(model.metadata.name, "proyecto-sin-nombre");
  const approvedDecisions = approved(model.decisions);
  const pendingDecisions = pending(model.decisions);
  const target = targetInstructions(targetAgent);
  const generatedAt = new Date().toISOString();

  const files: CompiledFile[] = [];
  const add = (filename: string, purpose: string, content: string) => files.push({ filename, purpose, content: content.trim() + "\n" });

  add(
    "README.md",
    "Punto de entrada humano del proyecto",
    `# ${projectName}

${text(model.metadata.summary, text(model.discovery.problem))}

## Estado

- Madurez: **${model.maturity}**
- Versión del modelo: **${model.metadata.version}**
- Perfil de compilación: **${targetAgent}**
- Generado: **${generatedAt}**

## Orden de lectura para el agente

1. \`${target.filename}\`
2. \`CONTEXT.md\`
3. \`MVP_SCOPE.md\`
4. \`SYSTEM_ARCHITECTURE.md\`
5. \`IMPLEMENTATION_PLAN.md\`
6. \`loops/DEVELOPMENT_LOOP.md\`
7. \`harness/HARNESS_SPEC.md\`
8. \`harness/ACCEPTANCE_CRITERIA.md\`

## Regla principal

No amplíes el alcance ni agregues tecnología sin una decisión aprobada. Los elementos pendientes aparecen en \`DECISIONS.md\`.
`,
  );

  add(
    "CONTEXT.md",
    "Context Engineering operativo",
    `# Contexto operativo

## Problema

${text(model.discovery.problem)}

## Usuarios

${text(model.discovery.users)}

## Resultado esperado

${text(model.discovery.outcome)}

## Razón del proyecto

${text(model.discovery.rationale)}

## Perfil profesional del usuario

${text(model.metadata.professionProfile)}

## Entorno de destino

${text(model.metadata.targetEnvironment)}

## Conocimiento y fuentes disponibles

${text(model.context.knowledgeSources)}

## Restricciones

${text(model.context.constraints)}

## Supuestos

${text(model.context.assumptions)}

## Glosario

${text(model.context.glossary)}

## Reglas para resolver ambigüedades

${text(model.context.ambiguityRules, "Detenerse ante una ambigüedad que pueda alterar alcance, coste, seguridad o arquitectura. Proponer la opción mínima y solicitar aprobación humana.")}

## Fuente de verdad

El archivo \`config/project-model.json\` es la representación estructurada del Canvas. Si un documento contradice ese modelo, prevalece el dato aprobado más reciente del modelo.
`,
  );

  add(
    "MVP_SCOPE.md",
    "Delimitación de alcance",
    `# Alcance del MVP

## Incluido ahora

${text(model.scope.mvp)}

## Fuera de alcance

${text(model.scope.outOfScope)}

## Visión futura

${text(model.scope.futureVision)}

## Regla de control de alcance

Toda propuesta no incluida explícitamente en el MVP debe registrarse como decisión pendiente o trasladarse a la visión futura. No debe implementarse por iniciativa del agente.
`,
  );

  add(
    "SYSTEM_ARCHITECTURE.md",
    "Arquitectura técnica aprobada",
    `# Arquitectura del sistema

## Forma general

${text(model.architecture.systemShape)}

## Capacidades necesarias

${text(model.architecture.capabilities)}

## Herramientas y stack

${text(model.architecture.tools)}

## Integraciones

${text(model.architecture.integrations)}

## Datos y memoria

${text(model.architecture.dataAndMemory)}

## Componentes y decisiones aprobadas

${decisionTable(approvedDecisions.filter((item) => item.category === "component" || item.category === "technology" || item.category === "decision"))}

## Principio de diseño

Preferir la solución más pequeña y comprobable. No incorporar MCP, RAG, bases vectoriales, sistemas multiagente, aprendizaje automático ni infraestructura distribuida salvo que exista una decisión aprobada que los justifique.
`,
  );

  add(
    "DECISIONS.md",
    "Registro de decisiones y trazabilidad",
    `# Registro de decisiones

## Aprobadas

${decisionTable(approvedDecisions)}

## Pendientes de aprobación

${decisionTable(pendingDecisions)}

## Rechazadas o fuera de alcance

${decisionTable(model.decisions.filter((item) => item.status === "rejected" || item.scope === "out"))}

## Regla

Ningún elemento con estado \`proposed\` puede tratarse como requisito confirmado.
`,
  );

  add(
    "RISKS.md",
    "Riesgos, supuestos y mitigaciones",
    `# Riesgos y supuestos

## Riesgos registrados

${decisionTable(model.decisions.filter((item) => item.category === "risk"))}

## Supuestos registrados

${decisionTable(model.decisions.filter((item) => item.category === "assumption"))}

## Restricciones relevantes

${text(model.context.constraints)}

## Política de escalamiento

Si un riesgo afecta datos, seguridad, coste, compatibilidad o alcance, detener la implementación y solicitar aprobación humana antes de continuar.
`,
  );

  add(
    "IMPLEMENTATION_PLAN.md",
    "Plan de implementación por fases",
    `# Plan de implementación

## Entregables

${text(model.delivery.deliverables)}

## Plan aprobado

${text(model.delivery.implementationPlan, `1. Preparar la estructura mínima del repositorio.\n2. Implementar un flujo vertical del MVP.\n3. Validar los criterios de aceptación.\n4. Corregir defectos antes de ampliar funcionalidad.\n5. Documentar decisiones y preparar la entrega.`)}

## Estructura esperada del repositorio

${text(model.delivery.repositoryShape, `- src/: implementación\n- tests/: pruebas automatizadas\n- docs/: documentación específica\n- config/: configuración sin secretos`)}

## Definición de terminado

Una tarea está terminada solo cuando cumple sus criterios de aceptación, pasa los quality gates aplicables, no introduce alcance no aprobado y deja documentación suficiente para la siguiente iteración.
`,
  );

  add(
    "loops/DEVELOPMENT_LOOP.md",
    "Loop Engineering del agente desarrollador",
    `# Development Loop

${text(model.loops.developmentLoop, `1. Leer el contexto y el alcance.\n2. Seleccionar una única tarea pequeña del MVP.\n3. Inspeccionar el repositorio antes de editar.\n4. Proponer un plan breve.\n5. Implementar el cambio mínimo.\n6. Ejecutar pruebas y quality gates.\n7. Corregir hasta cumplir.\n8. Registrar decisiones nuevas.\n9. Solicitar aprobación en puntos críticos.\n10. Detenerse cuando se cumpla la definición de terminado.`)}

## Aprobación humana

${text(model.loops.humanApproval)}

## Condiciones de detención

${text(model.loops.stopConditions, "Detenerse ante requisitos contradictorios, ausencia de criterios verificables, riesgos críticos o necesidad de ampliar el alcance.")}
`,
  );

  add(
    "loops/RUNTIME_LOOP.md",
    "Loop operativo del producto",
    `# Runtime Loop

${text(model.loops.runtimeLoop, "No se ha confirmado que el producto requiera un loop operativo autónomo. Si el producto es determinista, describir aquí su flujo normal de entrada, procesamiento, validación y salida.")}
`,
  );

  add(
    "loops/IMPROVEMENT_LOOP.md",
    "Ciclo de mejora continua",
    `# Improvement Loop

${text(model.loops.improvementLoop, `1. Recoger feedback verificable.\n2. Compararlo con los criterios de éxito.\n3. Registrar oportunidades sin alterar el MVP activo.\n4. Priorizar la siguiente iteración.\n5. Aprobar cambios de alcance.\n6. Actualizar el Project Model y recompilar.`)}
`,
  );

  add(
    "harness/HARNESS_SPEC.md",
    "Harness Engineering y controles de calidad",
    `# Especificación del Harness

## Estrategia de pruebas

${text(model.harness.testStrategy)}

## Quality gates

${text(model.harness.qualityGates)}

## Límites no funcionales

${text(model.harness.nonFunctionalLimits)}

## Regla de entrega

El agente no puede declarar una tarea terminada solo porque el código compila. Debe presentar evidencia de cada criterio aplicable y documentar cualquier gate no ejecutado.
`,
  );

  add(
    "harness/ACCEPTANCE_CRITERIA.md",
    "Criterios verificables de aceptación",
    `# Criterios de aceptación

## Criterios del MVP

${text(model.harness.acceptanceCriteria)}

## Criterios de éxito del producto

${text(model.harness.successCriteria)}

## Formato de evidencia

Para cada criterio, registrar:

- Resultado esperado.
- Método de verificación.
- Evidencia obtenida.
- Estado: pasa / falla / bloqueado.
- Observaciones y defectos encontrados.
`,
  );

  add(
    "harness/QUALITY_GATES.json",
    "Configuración estructurada de quality gates",
    JSON.stringify(
      {
        version: 1,
        project: projectName,
        gates: [
          { id: "scope", name: "Respeta el MVP", required: true, definition: text(model.scope.mvp) },
          { id: "acceptance", name: "Criterios de aceptación", required: true, definition: text(model.harness.acceptanceCriteria) },
          { id: "tests", name: "Estrategia de pruebas", required: true, definition: text(model.harness.testStrategy) },
          { id: "non_functional", name: "Límites no funcionales", required: false, definition: text(model.harness.nonFunctionalLimits) },
          { id: "documentation", name: "Documentación actualizada", required: true, definition: "Contexto, decisiones y plan coherentes con el código entregado." },
        ],
      },
      null,
      2,
    ),
  );

  add(
    target.filename,
    `Instrucciones específicas para ${targetAgent}`,
    `# ${target.title}

${target.notes}

## Secuencia obligatoria

1. Leer \`CONTEXT.md\`.
2. Leer \`MVP_SCOPE.md\`.
3. Revisar \`DECISIONS.md\` y no asumir como aprobada una propuesta pendiente.
4. Leer \`IMPLEMENTATION_PLAN.md\`.
5. Ejecutar el ciclo de \`loops/DEVELOPMENT_LOOP.md\`.
6. Validar mediante \`harness/HARNESS_SPEC.md\` y \`harness/ACCEPTANCE_CRITERIA.md\`.

## Prohibiciones

- No exponer ni solicitar claves API en archivos versionados.
- No agregar dependencias o servicios sin decisión aprobada.
- No ampliar el alcance del MVP.
- No reemplazar requisitos pendientes con suposiciones silenciosas.
`,
  );

  add(
    "config/project-model.json",
    "Fuente de verdad estructurada",
    JSON.stringify(model, null, 2),
  );

  add(
    "config/project.json",
    "Metadatos de compilación",
    JSON.stringify(
      {
        name: projectName,
        version: model.metadata.version,
        targetAgent,
        maturity: model.maturity,
        generatedAt,
        secretPolicy: "Las claves se suministran como variables de entorno y nunca se incluyen en el repositorio o ZIP.",
      },
      null,
      2,
    ),
  );

  add(
    ".env.example",
    "Plantilla segura de variables de entorno",
    `# Copiar a .env.local para desarrollo. Nunca subir el archivo real.\nOPENAI_API_KEY=replace_me\nOPENAI_MODEL=gpt-4o-mini\nPORT=3000`,
  );

  add(
    ".gitignore",
    "Protección básica de secretos y artefactos",
    `.env\n.env.*\n!.env.example\nnode_modules/\ndist/\ncoverage/\n*.log\n.DS_Store`,
  );

  add(
    "src/README.md",
    "Punto de entrada para implementación",
    `# Implementación

El código debe crearse siguiendo \`IMPLEMENTATION_PLAN.md\`. No añadir módulos vacíos para aparentar una arquitectura completa. Empezar por un flujo vertical mínimo y verificable.
`,
  );

  add(
    "tests/README.md",
    "Guía de pruebas",
    `# Pruebas

Implementar pruebas únicamente cuando exista comportamiento real que validar. Los casos deben derivarse de \`harness/ACCEPTANCE_CRITERIA.md\` y dejar evidencia reproducible.
`,
  );

  return files.sort((a, b) => a.filename.localeCompare(b.filename));
}
