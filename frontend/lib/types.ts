export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type AssessmentConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type EvidenceStatus = 'detected' | 'inferred' | 'unknown' | 'not_detected';
export type EvidenceSource =
  | 'object_detection'
  | 'segmentation'
  | 'depth_estimation'
  | 'scene_reasoning'
  | 'rule_engine'
  | 'unsupported';

export type AccessibilityClassification =
  | 'FULLY_ACCESSIBLE'
  | 'MOSTLY_ACCESSIBLE'
  | 'PARTIALLY_ACCESSIBLE'
  | 'LIMITED_ACCESSIBILITY';

export interface Detection {
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  category: string;
}

export interface Evidence {
  feature: string;
  status: EvidenceStatus;
  source: EvidenceSource;
  confidence?: number | null;
  description?: string | null;
}

export interface Risk {
  type: string;
  severity: RiskSeverity;
  description: string;
}

export interface Recommendation {
  priority: RecommendationPriority;
  text: string;
}

export interface ScoreBreakdown {
  base_score: number;
  penalties: number;
  rewards: number;
  factors: string[];
}

export interface AnalysisResponse {
  success: boolean;
  analysis_id: string;
  accessibility_score: number;
  classification: AccessibilityClassification;
  assessment_confidence: AssessmentConfidence;
  assessment_scope: string;
  detections: Detection[];
  evidence: Evidence[];
  risks: Risk[];
  recommendations: Recommendation[];
  uncertainties: string[];
  summary: string;
  processing_time_ms: number;
  inference_time_ms?: number | null;
  score_breakdown?: ScoreBreakdown;
  annotated_image?: string | null;
}

export interface DemoScene {
  id: string;
  title: string;
  tagline: string;
  description: string;
  expectedTier: string;
  barrierSummary: string;
  generateBlob: () => Promise<File>;
}
