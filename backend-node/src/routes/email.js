import express from 'express';
import { sendTestEmail, isEmailConfigured } from '../utils/emailService.js';

const router = express.Router();

// Test email endpoint
router.post('/test', async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!isEmailConfigured()) {
      return res.status(400).json({ 
        error: 'Email service not configured',
        message: 'Please set SMTP_USER, SMTP_PASSWORD, and other SMTP environment variables'
      });
    }

    const result = await sendTestEmail(email);

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Test email sent successfully',
        messageId: result.messageId 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    next(error);
  }
});

// Check email configuration
router.get('/config', (req, res) => {
  res.json({
    configured: isEmailConfigured(),
    message: isEmailConfigured() 
      ? 'Email service is configured and ready'
      : 'Email service is not configured. Set SMTP environment variables.'
  });
});

export default router;

