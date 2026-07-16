import { CanvasField, ProjectModel, ProjectMaturity } from "./types";

export const nowIso = () => new Date().toISOString();

export const emptyField = (): CanvasField => ({
  value: "",
  source: "system",
  status: "draft",
  confidence: 0,
  updatedAt: nowIso(),
});

export const createEmptyProjectModel = (): ProjectModel => {
  const createdAt = nowIso();
  return {
    metadata: {
      name: emptyField(),
      summary: emptyField(),
      professionProfile: emptyField(),
      targetEnvironment: emptyField(),
      version: "0.1.0",
      createdAt,
      updatedAt: createdAt,
    },
    discovery: {
      problem: emptyField(),
      users: emptyField(),
      outcome: emptyField(),
      rationale: emptyField(),
    },
    scope: {
      mvp: emptyField(),
      outOfScope: emptyField(),
      futureVision: emptyField(),
    },
    context: {
      knowledgeSources: emptyField(),
      constraints: emptyField(),
      glossary: emptyField(),
      assumptions: emptyField(),
      ambiguityRules: emptyField(),
    },
    architecture: {
      capabilities: emptyField(),
      tools: emptyField(),
      systemShape: emptyField(),
      integrations: emptyField(),
      dataAndMemory: emptyField(),
    },
    loops: {
      developmentLoop: emptyField(),
      runtimeLoop: emptyField(),
      improvementLoop: emptyField(),
      humanApproval: emptyField(),
      stopConditions: emptyField(),
    },
    harness: {
      successCriteria: emptyField(),
      acceptanceCriteria: emptyField(),
      qualityGates: emptyField(),
      testStrategy: emptyField(),
      nonFunctionalLimits: emptyField(),
    },
    delivery: {
      deliverables: emptyField(),
      implementationPlan: emptyField(),
      repositoryShape: emptyField(),
    },
    decisions: [],
    maturity: "idea",
  };
};

export const fieldPaths = [
  "metadata.name",
  "metadata.summary",
  "metadata.professionProfile",
  "metadata.targetEnvironment",
  "discovery.problem",
  "discovery.users",
  "discovery.outcome",
  "discovery.rationale",
  "scope.mvp",
  "scope.outOfScope",
  "scope.futureVision",
  "context.knowledgeSources",
  "context.constraints",
  "context.glossary",
  "context.assumptions",
  "context.ambiguityRules",
  "architecture.capabilities",
  "architecture.tools",
  "architecture.systemShape",
  "architecture.integrations",
  "architecture.dataAndMemory",
  "loops.developmentLoop",
  "loops.runtimeLoop",
  "loops.improvementLoop",
  "loops.humanApproval",
  "loops.stopConditions",
  "harness.successCriteria",
  "harness.acceptanceCriteria",
  "harness.qualityGates",
  "harness.testStrategy",
  "harness.nonFunctionalLimits",
  "delivery.deliverables",
  "delivery.implementationPlan",
  "delivery.repositoryShape",
] as const;

export type FieldPath = (typeof fieldPaths)[number];

export const maturityOrder: ProjectMaturity[] = [
  "idea",
  "problem-understood",
  "architecture-draft",
  "mvp-defined",
  "quality-defined",
  "ready-to-compile",
];

export const maturityLabel: Record<ProjectMaturity, string> = {
  idea: "Idea inicial",
  "problem-understood": "Problema comprendido",
  "architecture-draft": "Arquitectura preliminar",
  "mvp-defined": "MVP definido",
  "quality-defined": "Calidad definida",
  "ready-to-compile": "Listo para compilar",
};
