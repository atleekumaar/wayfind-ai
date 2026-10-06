import { AnalysisResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function analyzeImage(
  imageFile: File,
  confidenceThreshold?: number
): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);

  let url = `${API_BASE_URL}/api/v1/analyze`;
  if (confidenceThreshold !== undefined) {
    url += `?confidence_threshold=${confidenceThreshold}`;
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
