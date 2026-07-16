export type FieldSource = "user" | "architect" | "system";
export type FieldStatus = "draft" | "pending" | "approved" | "rejected" | "frozen";
export type DecisionStatus = "proposed" | "approved" | "rejected" | "frozen";
export type ScopeLevel = "mvp" | "future" | "out";
export type ProjectMaturity =
  | "idea"
  | "problem-understood"
  | "architecture-draft"
  | "mvp-defined"
  | "quality-defined"
  | "ready-to-compile";

export interface CanvasField {
  value: string;
  source: FieldSource;
  status: FieldStatus;
  confidence: number;
  updatedAt: string;
}

export interface ProjectMetadata {
  name: CanvasField;
  summary: CanvasField;
  professionProfile: CanvasField;
  targetEnvironment: CanvasField;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoverySection {
  problem: CanvasField;
  users: CanvasField;
  outcome: CanvasField;
  rationale: CanvasField;
}

export interface ScopeSection {
  mvp: CanvasField;
  outOfScope: CanvasField;
  futureVision: CanvasField;
}

export interface ContextSection {
  knowledgeSources: CanvasField;
  constraints: CanvasField;
  glossary: CanvasField;
  assumptions: CanvasField;
  ambiguityRules: CanvasField;
}

export interface ArchitectureSection {
  capabilities: CanvasField;
  tools: CanvasField;
  systemShape: CanvasField;
  integrations: CanvasField;
  dataAndMemory: CanvasField;
}

export interface LoopSection {
  developmentLoop: CanvasField;
  runtimeLoop: CanvasField;
  improvementLoop: CanvasField;
  humanApproval: CanvasField;
  stopConditions: CanvasField;
}

export interface HarnessSection {
  successCriteria: CanvasField;
  acceptanceCriteria: CanvasField;
  qualityGates: CanvasField;
  testStrategy: CanvasField;
  nonFunctionalLimits: CanvasField;
}

export interface DeliverySection {
  deliverables: CanvasField;
  implementationPlan: CanvasField;
  repositoryShape: CanvasField;
}

export interface DecisionItem {
  id: string;
  title: string;
  description: string;
  rationale: string;
  source: FieldSource;
  status: DecisionStatus;
  scope: ScopeLevel;
  category: "component" | "technology" | "risk" | "assumption" | "decision";
  confidence: number;
  createdAt: string;
}

export interface ProjectModel {
  metadata: ProjectMetadata;
  discovery: DiscoverySection;
  scope: ScopeSection;
  context: ContextSection;
  architecture: ArchitectureSection;
  loops: LoopSection;
  harness: HarnessSection;
  delivery: DeliverySection;
  decisions: DecisionItem[];
  maturity: ProjectMaturity;
}

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export interface ArchitectUpdate {
  path: string;
  value: string;
  confidence: number;
  reason: string;
}

export interface ArchitectResponse {
  response: string;
  updates: ArchitectUpdate[];
  proposals: DecisionItem[];
  maturity: ProjectMaturity;
}

export interface CompiledFile {
  filename: string;
  content: string;
  purpose: string;
}
