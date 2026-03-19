import express from 'express';
import { aiService } from '../config/fastapi.js';
import { supabaseAdmin, supabase } from '../config/supabase.js';

const router = express.Router();

// Health check for AI service (FastAPI if available)
router.get('/health', async (req, res, next) => {
  try {
    // Try to check FastAPI if available, otherwise return service unavailable
    if (aiService) {
      const health = await aiService.healthCheck();
      res.json(health);
    } else {
      res.json({ 
        status: 'unavailable', 
        message: 'AI service (FastAPI) not configured. Install and start FastAPI backend for AI features.' 
      });
    }
  } catch (error) {
    res.json({ 
      status: 'unavailable', 
      error: error.message,
      message: 'AI service not available. FastAPI backend may not be running.' 
    });
  }
});

// Get all active models
router.get('/active-models', async (req, res, next) => {
  try {
    const clientToUse = supabaseAdmin || supabase;
    const { data: models, error } = await clientToUse
      .from('ai_models')
      .select('id, name, file_path, weight, enabled, status')
      .eq('enabled', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AI Route] Error fetching active models:', error);
      return res.status(500).json({ error: 'Failed to fetch active models', details: error.message });
    }

    res.json({ models: models || [] });
  } catch (error) {
    console.error('[AI Route] Error in active-models endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch active models', details: error.message });
  }
});

// Run model inference (proxy to FastAPI if available)
// Supports single model (modelId) or ensemble (useAllActive=true)
router.post('/predict', async (req, res, next) => {
  try {
    const { features, modelId, useAllActive } = req.body;

    if (!features || !Array.isArray(features)) {
      return res.status(400).json({ error: 'Features array is required' });
    }

    if (!aiService) {
      return res.status(503).json({ 
        error: 'AI service not available',
        message: 'FastAPI backend is not configured. Please set up FastAPI for AI model inference.'
      });
    }

    // If useAllActive is true, get all active models and run ensemble prediction
    if (useAllActive) {
      try {
        const clientToUse = supabaseAdmin || supabase;
        const { data: activeModels, error: modelsError } = await clientToUse
          .from('ai_models')
          .select('id, name, file_path, weight, enabled, status')
          .eq('enabled', true)
          .eq('status', 'active');

        if (modelsError) {
          console.error('[AI Route] Error fetching active models:', modelsError);
          return res.status(500).json({ error: 'Failed to fetch active models', details: modelsError.message });
        }

        if (!activeModels || activeModels.length === 0) {
          return res.status(400).json({ error: 'No active models found. Please activate at least one model.' });
        }

        console.log(`[AI Route] 🎯 ENSEMBLE MODE: Running prediction with ${activeModels.length} active model(s) from database:`);
        activeModels.forEach((model, idx) => {
          console.log(`   ${idx + 1}. ${model.name} (ID: ${model.id}, Weight: ${((model.weight || 0.25) * 100).toFixed(0)}%, Path: ${model.file_path})`);
        });

        // Run predictions for all active models
        const predictions = await Promise.all(
          activeModels.map(async (model) => {
            try {
              console.log(`[AI Route] 🔄 Running inference with model: ${model.name} (${model.file_path})`);
              const result = await aiService.predict(features, model.file_path);
              console.log(`[AI Route] ✅ Model ${model.name} result: score=${(result.anomalyScore * 100).toFixed(1)}%, anomaly=${result.isAnomaly}`);
              return {
                modelId: model.id,
                modelName: model.name,
                weight: model.weight || 0.25,
                ...result
              };
            } catch (error) {
              console.error(`[AI Route] ❌ Error predicting with model ${model.name}:`, error.message);
              return null; // Skip failed models
            }
          })
        );

        // Filter out failed predictions
        const validPredictions = predictions.filter(p => p !== null);
        
        if (validPredictions.length === 0) {
          return res.status(500).json({ error: 'All model predictions failed' });
        }

        // Calculate weighted average of anomaly scores
        const totalWeight = validPredictions.reduce((sum, p) => sum + (p.weight || 0.25), 0);
        const weightedScore = validPredictions.reduce((sum, p) => 
          sum + (p.anomalyScore * (p.weight || 0.25)), 0
        ) / totalWeight;

        // Anomaly if weighted score > 0.7 (or if majority of models say anomaly)
        const anomalyVotes = validPredictions.filter(p => p.isAnomaly).length;
        const isAnomaly = weightedScore > 0.7 || (anomalyVotes / validPredictions.length) > 0.5;

        // Average confidence
        const avgConfidence = validPredictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / validPredictions.length;

        const ensembleResult = {
          anomalyScore: weightedScore,
          isAnomaly,
          confidence: avgConfidence,
          modelsUsed: validPredictions.map(p => ({ id: p.modelId, name: p.modelName, weight: p.weight })),
          modelCount: validPredictions.length
        };

        console.log(`[AI Route] ✅ ENSEMBLE RESULT:`);
        console.log(`   Final Score: ${(weightedScore * 100).toFixed(1)}%`);
        console.log(`   Is Anomaly: ${isAnomaly}`);
        console.log(`   Models Used: ${validPredictions.map(p => p.modelName).join(', ')}`);
        console.log(`   Individual Scores:`, validPredictions.map(p => `${p.modelName}: ${(p.anomalyScore * 100).toFixed(1)}%`).join(', '));
        
        res.json(ensembleResult);
        return;
      } catch (ensembleError) {
        console.error('[AI Route] Ensemble prediction error:', ensembleError);
        return res.status(500).json({ error: 'Ensemble prediction failed', details: ensembleError.message });
      }
    }

    // Single model prediction (backward compatibility)
    let modelPath = null;
    let modelName = null;
    if (modelId) {
      try {
        const clientToUse = supabaseAdmin || supabase;
        const { data: model, error: modelError } = await clientToUse
          .from('ai_models')
          .select('file_path, name, enabled')
          .eq('id', modelId)
          .maybeSingle();

        if (modelError) {
          console.error('[AI Route] Error fetching model:', modelError);
          return res.status(404).json({ error: 'Model not found', details: modelError.message });
        }

        if (!model) {
          return res.status(404).json({ error: 'Model not found' });
        }

        if (!model.enabled) {
          return res.status(400).json({ error: 'Model is not enabled' });
        }

        modelPath = model.file_path;
        modelName = model.name;
        console.log(`[AI Route] Using model ${modelId} (${modelName}) from path: ${modelPath}`);
      } catch (dbError) {
        console.error('[AI Route] Database error fetching model:', dbError);
        return res.status(500).json({ error: 'Failed to fetch model from database', details: dbError.message });
      }
    }

    if (!useAllActive && !modelId) {
      console.log(`[AI Route] ⚠️  WARNING: Using default model (hardcoded path). Consider using useAllActive=true to use active models from database.`);
    }
    console.log(`[AI Route] Received prediction request with ${features.length} feature sequences${modelId ? ` using model ${modelId}` : ' (default model)'}`);
    const result = await aiService.predict(features, modelPath);
    console.log(`[AI Route] Prediction result:`, result);
    
    // Add model name if single model was used
    if (modelName) {
      result.modelName = modelName;
      result.modelId = modelId;
    }
    
    res.json(result);
  } catch (error) {
    console.error('[AI Route] Prediction error:', error.message);
    res.status(503).json({ 
      error: 'AI inference failed',
      message: error.message,
      hint: 'Ensure FastAPI backend is running on port 5000. Check backend-node logs for details.'
    });
  }
});

// Process CSV with AI model
router.post('/process-csv', async (req, res, next) => {
  res.status(400).json({ 
    error: 'Use /api/data-sources/upload-csv endpoint for CSV processing' 
  });
});

export default router;

