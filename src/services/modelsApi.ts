// Models API Service
// Connects to Node.js backend at http://localhost:3000

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface AIModel {
  id: string;
  name: string;
  type: "account_compromise" | "insider_threat" | "anomaly_detection" | "risk_fusion";
  framework: string;
  status: "active" | "training" | "inactive" | "error";
  accuracy: number | null;
  precision: number | null;
  recall: number | null;
  f1Score: number | null;
  f1_score?: number | null;
  lastTrained?: string;
  last_trained?: string;
  predictions: number;
  weight: number;
  enabled: boolean;
  description?: string;
  requiredFeatures?: string[];
  required_features?: string[];
  filePath?: string;
  file_path?: string;
  fileName?: string;
  file_name?: string;
  fileSize?: number;
  file_size?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface CreateModelRequest {
  name: string;
  type: "account_compromise" | "insider_threat" | "anomaly_detection" | "risk_fusion";
  framework: "pytorch" | "tensorflow" | "onnx";
  description?: string;
  requiredFeatures?: string;
  weight?: number;
  modelFile: File;
}

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      // Don't set Content-Type for FormData - browser will set it with boundary
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
};

// Normalize model data from backend
const normalizeModel = (model: any): AIModel => ({
  ...model,
  f1Score: model.f1_score ?? model.f1Score ?? null,
  lastTrained: model.last_trained ?? model.lastTrained,
  requiredFeatures: model.required_features ?? model.requiredFeatures,
  filePath: model.file_path ?? model.filePath,
  fileName: model.file_name ?? model.fileName,
  fileSize: model.file_size ?? model.fileSize,
  createdAt: model.created_at ?? model.createdAt,
  updatedAt: model.updated_at ?? model.updatedAt,
});

export const modelsApi = {
  // Get all models
  async getAll(): Promise<AIModel[]> {
    const data = await apiRequest<any[]>('/api/models');
    return data.map(normalizeModel);
  },

  // Get active models only
  async getActiveModels(): Promise<Array<{ id: string; name: string; weight: number }>> {
    const response = await apiRequest<{ models: any[] }>('/api/ai/active-models');
    return response.models.map(m => ({
      id: m.id,
      name: m.name,
      weight: m.weight || 0.25
    }));
  },

  // Get single model
  async getById(id: string): Promise<AIModel> {
    const data = await apiRequest<any>(`/api/models/${id}`);
    return normalizeModel(data);
  },

  // Upload new model
  async upload(request: CreateModelRequest): Promise<AIModel> {
    const formData = new FormData();
    formData.append('modelFile', request.modelFile);
    formData.append('name', request.name);
    formData.append('type', request.type);
    formData.append('framework', request.framework);
    if (request.description) formData.append('description', request.description);
    if (request.requiredFeatures) formData.append('requiredFeatures', request.requiredFeatures);
    if (request.weight) formData.append('weight', request.weight.toString());

    const response = await fetch(`${API_BASE_URL}/api/models/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `Failed to upload model: ${response.statusText}`);
    }

    const data = await response.json();
    return normalizeModel(data);
  },

  // Update model
  async update(id: string, updates: Partial<AIModel>): Promise<AIModel> {
    const data = await apiRequest<any>(`/api/models/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return normalizeModel(data);
  },

  // Delete model
  async delete(id: string): Promise<void> {
    await apiRequest<void>(`/api/models/${id}`, {
      method: 'DELETE',
    });
  },

  // Toggle model enabled/disabled
  async toggle(id: string, enabled: boolean): Promise<AIModel> {
    const data = await apiRequest<any>(`/api/models/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    });
    return normalizeModel(data);
  },
};


