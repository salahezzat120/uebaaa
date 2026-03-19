# 🚀 Start Building Insider Threat Detection - RIGHT NOW!

## Quick Start (5 Minutes)

### **Step 1: Test Feature Extraction**

```bash
cd backend-fastapi
python -c "from insider_threat_detector import InsiderThreatFeatureExtractor; print('✅ Module loaded!')"
```

If this works, you're ready! ✅

---

### **Step 2: Test Detection with Your Existing Model**

```bash
cd backend-fastapi
python test_insider_detection.py
```

This will:
- ✅ Load your existing model
- ✅ Test brute force detection
- ✅ Test location hopping detection
- ✅ Test off-hours access detection

**Expected output:**
```
🧪 Test 1: Brute Force Attack
✅ Loaded model from: models/lstm_ae_cert.h5
📊 Scenario: 10 failed login attempts in 5 minutes
✅ Results:
   Anomaly: True
   Threat Type: brute_force
   ✅ ✅ ✅ BRUTE FORCE DETECTED CORRECTLY!
```

---

### **Step 3: Train New Model (Optional)**

If you want a model specifically trained for insider threats:

```bash
cd backend-fastapi
python train_insider_threat_model.py
```

This will:
- ✅ Create training data (or use your existing data)
- ✅ Extract 20 features
- ✅ Train LSTM Autoencoder
- ✅ Save model to `insider_threat_model.h5`

**Time:** 10-30 minutes

---

## 🎯 What You Get

After running these steps, you'll have:

1. ✅ **Feature extraction** - 20 features including brute force indicators
2. ✅ **Threat detection** - Detects brute force, location hopping, off-hours access
3. ✅ **Working model** - Either your existing model or new trained model
4. ✅ **Test results** - See what threats are detected

---

## 📋 Next Steps

1. **If tests work:** Integrate into your FastAPI (see `BUILD_INSIDER_THREAT_MODEL.md` Phase 3)
2. **If tests fail:** Check error messages and fix issues
3. **Want to customize:** Edit `insider_threat_detector.py` to adjust thresholds

---

## 🐛 Troubleshooting

### **Error: Module not found**
```bash
# Make sure you're in backend-fastapi directory
cd backend-fastapi
python test_insider_detection.py
```

### **Error: Model not found**
- Your model should be at: `models/lstm_ae_cert.h5` or `../models/lstm_ae_cert.h5`
- Or train a new one: `python train_insider_threat_model.py`

### **Error: Import errors**
```bash
# Install dependencies
pip install tensorflow pandas numpy scikit-learn
```

---

## ✅ Success Checklist

- [ ] Feature extraction module loads
- [ ] Test script runs without errors
- [ ] Brute force detection works
- [ ] Location hopping detection works
- [ ] Model trains successfully (if you train new one)

---

## 🎉 You're Ready!

**Start with Step 1 above and you'll be detecting insider threats in 5 minutes!**

For detailed guide, see: `BUILD_INSIDER_THREAT_MODEL.md`






