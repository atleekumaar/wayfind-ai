export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type AssessmentConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type EvidenceSufficiency = 'sufficient_evidence' | 'limited_evidence' | 'insufficient_evidence' | 'analysis_failed';
export type EvidenceStatus = 'detected' | 'inferred' | 'unknown' | 'not_detected';
export type EvidenceSource =
  | 'object_detection'
  | 'segmentation'
  | 'depth_estimation'
  | 'scene_reasoning'
  | 'spatial_corridor_analysis'
  | 'rule_engine'
  | 'unsupported';

export type AccessibilityClassification =
  | 'FULLY_ACCESSIBLE'
  | 'MOSTLY_ACCESSIBLE'
  | 'PARTIALLY_ACCESSIBLE'
  | 'LIMITED_ACCESSIBILITY';

export type AccessibilityProfile =
  | 'general_mobility'
  | 'wheelchair'
  | 'walker'
  | 'stroller'
  | 'low_vision';

export interface Detection {
  id?: string;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number];
  category: string;
  source_model?: string;
  is_model_supported?: boolean;
  detection_status?: 'detected' | 'inferred' | 'unknown' | 'unsupported';
  limitations?: string | null;
  viewpoint_index?: number;
}

export interface SpatialAssessment {
  class_name: string;
  bbox: [number, number, number, number];
  relation_to_path: 'inside_navigation_corridor' | 'boundary_corridor' | 'outside_navigation_corridor';
  overlap_ratio: number;
  proximity_level: 'immediate_foreground' | 'midground_corridor' | 'background_context';
  navigation_relevance: 'corridor_obstruction' | 'pathway_restriction' | 'contextual_outside_corridor';
  confidence: number;
  explanation: string;
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

export interface ScoreBreakdownFactor {
  factor: string;
  points: number;
  category: string;
  status: EvidenceStatus;
  source: string;
  confidence?: number | null;
  detection_id?: string | null;
  rule_name?: string | null;
  spatial_relevance?: string | null;
}

export interface ScoreBreakdown {
  base_score: number;
  penalties: number;
  rewards: number;
  factors: string[];
  detailed_factors?: ScoreBreakdownFactor[];
}

export interface AnalysisResponse {
  success: boolean;
  analysis_id: string;
  accessibility_score: number;
  classification: AccessibilityClassification;
  assessment_confidence: AssessmentConfidence;
  vision_confidence?: number | null;
  evidence_sufficiency?: EvidenceSufficiency;
  assessment_scope: string;
  profile: AccessibilityProfile;
  image_source_label: string;
  viewpoints_analyzed: number;
  detections: Detection[];
  spatial_assessments?: SpatialAssessment[];
  evidence: Evidence[];
  risks: Risk[];
  recommendations: Recommendation[];
  uncertainties: string[];
  summary: string;
  speech_summary?: string | null;
  processing_time_ms: number;
  inference_time_ms?: number | null;
  hardware_runtime?: string;
  score_breakdown?: ScoreBreakdown;
  annotated_image?: string | null;
}

export interface MultiViewAnalysisResponse {
  success: boolean;
  analysis_id: string;
  accessibility_score: number;
  classification: AccessibilityClassification;
  assessment_confidence: AssessmentConfidence;
  vision_confidence?: number | null;
  profile: AccessibilityProfile;
  viewpoints_count: number;
  individual_analyses: AnalysisResponse[];
  fused_evidence: Evidence[];
  fused_risks: Risk[];
  fused_recommendations: Recommendation[];
  fused_uncertainties: string[];
  summary: string;
  speech_summary?: string | null;
  total_processing_time_ms: number;
}

export interface DemoScene {
  id: string;
  title: string;
  tagline: string;
  description: string;
  expectedTier: string;
  expectedScoreRange: string;
  expectedEvidence: string[];
  barrierSummary: string;
  whyItMatters: string;
  generateBlob: () => Promise<File>;
}
