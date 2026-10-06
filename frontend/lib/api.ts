import { AnalysisResponse, MultiViewAnalysisResponse, AccessibilityProfile } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function analyzeImage(
  imageFile: File,
  confidenceThreshold?: number,
  profile: AccessibilityProfile = 'general_mobility',
  isDemo = false
): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const label = isDemo ? 'CURATED_DEMO_SCENE_SYNTHETIC' : 'USER_IMAGE';
  let url = `${API_BASE_URL}/api/v1/analyze?profile=${profile}&image_source_label=${label}`;
  if (confidenceThreshold !== undefined) {
    url += `&confidence_threshold=${confidenceThreshold}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Server error (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function analyzeMultiView(
  imageFiles: File[],
  confidenceThreshold?: number,
  profile: AccessibilityProfile = 'general_mobility'
): Promise<MultiViewAnalysisResponse> {
  const formData = new FormData();
  for (const file of imageFiles.slice(0, 3)) {
    formData.append('images', file);
  }

  let url = `${API_BASE_URL}/api/v1/analyze-multiview?profile=${profile}`;
  if (confidenceThreshold !== undefined) {
    url += `&confidence_threshold=${confidenceThreshold}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Multi-view error (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorMsg = typeof errorJson.detail === 'string' ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      // Fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}
