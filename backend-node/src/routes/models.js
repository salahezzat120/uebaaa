import express from 'express';
import multer from 'multer';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { createActivityLog } from '../utils/activityLogger.js';

const router = express.Router();
const upload = multer({ 
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const modelsDir = path.join(__dirname, '..', '..', 'models');
      try {
        await fs.mkdir(modelsDir, { recursive: true });
        cb(null, modelsDir);
      } catch (error) {
        cb(error, null);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `model-${uniqueSuffix}${ext}`);
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max
});

// Get all models
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.warn('AI models table does not exist yet. Run the migration.');
        return res.json([]);
      }
      throw error;
    }

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.json([]);
  }
});

// Upload new model
router.post('/upload', upload.single('modelFile'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Model file is required' });
    }

    const { name, type, framework, description, requiredFeatures, weight } = req.body;

    if (!name || !type || !framework) {
      // Clean up uploaded file if validation fails
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({ error: 'Name, type, and framework are required' });
    }

    // Parse requiredFeatures - handle both JSON array and comma-separated string
    let requiredFeaturesArray = null;
    if (requiredFeatures) {
      try {
        // Try parsing as JSON first
        requiredFeaturesArray = JSON.parse(requiredFeatures);
      } catch (e) {
        // If not JSON, treat as comma-separated string
        requiredFeaturesArray = requiredFeatures
          .split(',')
          .map(f => f.trim())
          .filter(f => f.length > 0);
      }
    }

    // Save model info to database
    const { data, error } = await (supabaseAdmin || supabase)
      .from('ai_models')
      .insert({
        name,
        type,
        framework,
        description: description || null,
        required_features: requiredFeaturesArray,
        status: 'inactive', // Start as inactive until activated
        file_path: req.file.path,
        file_name: req.file.originalname,
        file_size: req.file.size,
        weight: weight ? parseFloat(weight) : 0.25,
        enabled: false,
        accuracy: null,
        precision: null,
        recall: null,
        f1_score: null,
        predictions: 0,
      })
      .select()
      .single();

    if (error) {
      // Clean up file if database insert fails
      await fs.unlink(req.file.path).catch(console.error);
      throw error;
    }

    console.log(`[Model Upload] Model ${name} uploaded successfully: ${req.file.path}`);

    // Log activity
    const actor = req.body.actor || req.headers['x-user-email'] || 'system';
    await createActivityLog('Model uploaded', actor, {
      type: 'model',
      status: 'success',
      target: name,
      details: `Model ${name} (${type}, ${framework}) uploaded successfully`,
      metadata: { model_id: data.id, model_name: name, framework, type },
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

// Update model
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Convert camelCase to snake_case for database
    const dbUpdates = {};
    if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
    if (updates.accuracy !== undefined) dbUpdates.accuracy = updates.accuracy;
    if (updates.precision !== undefined) dbUpdates.precision = updates.precision;
    if (updates.recall !== undefined) dbUpdates.recall = updates.recall;
    if (updates.f1Score !== undefined) dbUpdates.f1_score = updates.f1Score;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    dbUpdates.updated_at = new Date().toISOString();

    // Check if model exists first
    const { data: existingModel, error: fetchError } = await supabase
      .from('ai_models')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existingModel) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const { data, error } = await supabase
      .from('ai_models')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Log activity for model updates
    const actor = req.body.actor || req.headers['x-user-email'] || 'system';
    let actionDetails = [];
    
    if (updates.enabled !== undefined) {
      actionDetails.push(`Model ${updates.enabled ? 'enabled' : 'disabled'}`);
    }
    if (updates.weight !== undefined) {
      actionDetails.push(`Weight updated to ${updates.weight}`);
    }
    if (updates.name !== undefined) {
      actionDetails.push(`Name updated to ${updates.name}`);
    }
    if (updates.description !== undefined) {
      actionDetails.push('Description updated');
    }
    if (updates.accuracy !== undefined || updates.precision !== undefined || updates.recall !== undefined) {
      actionDetails.push('Performance metrics updated');
    }

    if (actionDetails.length > 0) {
      const actionText = actionDetails.length === 1 
        ? `Model ${actionDetails[0].toLowerCase()}`
        : 'Model configuration updated';
      
      await createActivityLog(
        actionDetails.length === 1 && updates.enabled !== undefined 
          ? `Model ${updates.enabled ? 'enabled' : 'disabled'}`
          : 'Model configuration updated',
        actor,
        {
          type: 'model',
          status: 'success',
          target: data.name || id,
          details: actionDetails.join(', '),
          metadata: { model_id: id, updates },
        }
      );
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Delete model
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get model info first to delete file and log activity
    const { data: model, error: fetchError } = await supabase
      .from('ai_models')
      .select('name, file_path')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('ai_models')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Delete file if exists
    if (model && model.file_path) {
      try {
        await fs.unlink(model.file_path);
        console.log(`[Model Delete] Deleted file: ${model.file_path}`);
      } catch (fileError) {
        console.warn(`[Model Delete] Could not delete file: ${model.file_path}`, fileError);
      }
    }

    // Log activity
    const actor = req.body.actor || req.headers['x-user-email'] || 'system';
    await createActivityLog('Model deleted', actor, {
      type: 'model',
      status: 'success',
      target: model?.name || id,
      details: `Model ${model?.name || id} deleted`,
      metadata: { model_id: id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Activate/Deactivate model (must be before /:id route to match correctly)
router.post('/:id/toggle', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;

    console.log(`[Model Toggle] Toggling model ${id}, enabled: ${enabled}`);

    // Use admin client to bypass RLS for all operations
    const clientToUse = supabaseAdmin || supabase;
    if (!clientToUse) {
      return res.status(500).json({ error: 'Database client not available' });
    }

    // Get current model state first
    const { data: currentModel, error: fetchError } = await clientToUse
      .from('ai_models')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError) {
      console.error('[Model Toggle] Error fetching model:', fetchError);
      throw fetchError;
    }
    
    if (!currentModel) {
      console.error(`[Model Toggle] Model ${id} not found`);
      return res.status(404).json({ error: 'Model not found' });
    }

    // Determine new state
    const newEnabled = enabled !== undefined ? enabled : !currentModel.enabled;
    const newStatus = newEnabled ? 'active' : 'inactive';

    console.log(`[Model Toggle] Updating model ${id} to enabled=${newEnabled}, status=${newStatus}`);

    // Update model - use admin client to bypass RLS
    const { data, error } = await clientToUse
      .from('ai_models')
      .update({
        enabled: newEnabled,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[Model Toggle] Error updating model:', error);
      console.error('[Model Toggle] Error details:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    if (!data) {
      console.error(`[Model Toggle] Model ${id} not found after update`);
      // Try to fetch the model again to see if it exists
      const { data: checkData, error: checkError } = await clientToUse
        .from('ai_models')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (checkError) {
        console.error('[Model Toggle] Error checking model after update:', checkError);
      } else if (checkData) {
        console.log('[Model Toggle] Model exists but select after update returned null - RLS issue?');
        // Return the model we just fetched
        return res.json(checkData);
      }
      
      return res.status(404).json({ error: 'Model not found' });
    }

    console.log(`[Model Toggle] Successfully toggled model ${id}`);
    
    // Log activity for model toggle
    const actor = req.body.actor || req.headers['x-user-email'] || 'system';
    await createActivityLog(
      `Model ${newEnabled ? 'enabled' : 'disabled'}`,
      actor,
      {
        type: 'model',
        status: 'success',
        target: currentModel.name || id,
        details: `Model ${currentModel.name || id} ${newEnabled ? 'enabled' : 'disabled'}`,
        metadata: { model_id: id, enabled: newEnabled, status: newStatus },
      }
    );
    
    res.json(data);
  } catch (error) {
    console.error('[Model Toggle] Unexpected error:', error);
    next(error);
  }
});

// Get single model (must be after /:id/toggle route)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('ai_models')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Model not found' });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;

