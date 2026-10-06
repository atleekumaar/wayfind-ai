export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecommendationPriority = 'LOW' | 'MEDIUM' | 'HIGH';
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
  detections: Detection[];
  risks: Risk[];
  recommendations: Recommendation[];
  summary: string;
  processing_time_ms: number;
  score_breakdown?: ScoreBreakdown;
  annotated_image?: string | null;
}
