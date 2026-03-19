import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Use 127.0.0.1 instead of localhost to force IPv4 (avoid IPv6 ::1 issues)
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:5000';
const FASTAPI_API_KEY = process.env.FASTAPI_API_KEY;

// Create axios instance for FastAPI
export const fastapiClient = axios.create({
  baseURL: FASTAPI_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(FASTAPI_API_KEY && { 'X-API-Key': FASTAPI_API_KEY }),
  },
  timeout: 30000, // 30 seconds for AI inference
});

// AI Service wrapper
export const aiService = {
  // Run model inference
  async predict(features, modelPath = null) {
    try {
      const requestBody = { features };
      if (modelPath) {
        requestBody.model_path = modelPath;
      }
      
      console.log(`[AI Service] Calling FastAPI /predict with ${features.length} feature sequences${modelPath ? ` using model: ${modelPath}` : ''}`);
      const response = await fastapiClient.post('/predict', requestBody);
      console.log(`[AI Service] FastAPI response received:`, response.data);
      return response.data;
    } catch (error) {
      console.error('[AI Service] FastAPI inference error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `${FASTAPI_URL}/predict`,
        modelPath
      });
      
      // Provide more detailed error
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to FastAPI at ${FASTAPI_URL}. Is FastAPI running?`);
      } else if (error.response) {
        throw new Error(`FastAPI error (${error.response.status}): ${error.response.data?.detail || error.response.data?.error || error.message}`);
      } else {
        throw new Error(`AI inference failed: ${error.message}`);
      }
    }
  },

  // Process CSV with model
  async processCSV(fileData, options = {}) {
    try {
      const formData = new FormData();
      formData.append('file', fileData);
      formData.append('options', JSON.stringify(options));

      const response = await fastapiClient.post('/api/inference/process-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('FastAPI CSV processing error:', error.message);
      throw new Error(`CSV processing failed: ${error.message}`);
    }
  },

  // Health check
  async healthCheck() {
    try {
      const response = await fastapiClient.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  },
};

