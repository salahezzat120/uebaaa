# Security Datasets for Account & Entity Compromise
## Complete Guide for S-UEBA Project

**Purpose:** Training and testing your UEBA system with real-world compromised account and entity data  
**Last Updated:** [Current Date]

---

## 🎯 Best Datasets for Account Compromise

### **1. CERT Insider Threat Dataset (RECOMMENDED) ⭐**

**Description:** The most comprehensive and widely-used dataset for UEBA research. Contains real-world insider threat scenarios including account compromise, data exfiltration, and malicious activities.

**Link:** 
- **Official Site:** https://www.cert.org/insider-threat-tools/
- **Direct Download:** https://www.cert.org/insider-threat-tools/datasets/

**What's Included:**
- User activity logs (logins, file access, email, etc.)
- Account compromise scenarios
- Data exfiltration patterns
- Malicious insider activities
- Ground truth labels (benign vs malicious)

**Format:** CSV files with user activity logs

**Size:** Multiple versions available (v4.2, v6.2, etc.)

**How to Use:**
1. Register on CERT website (free for research)
2. Download the dataset
3. Extract user activity logs
4. Use ground truth labels for training/testing

**Best For:**
- ✅ Account compromise detection
- ✅ User behavior analytics
- ✅ Insider threat detection
- ✅ Entity behavior analysis

---

### **2. GoMask.ai Account Takeover Detection Dataset**

**Description:** Synthetic dataset specifically designed for account takeover detection, including unauthorized access attempts and credential compromises.

**Link:** 
- **Website:** https://gomask.ai/marketplace/datasets/account-takeover-detection

**What's Included:**
- Account takeover incidents
- Unauthorized access attempts
- Credential compromises
- Abnormal transaction patterns
- Fraud detection scenarios

**Format:** Structured dataset (CSV/JSON)

**Best For:**
- ✅ Account takeover detection
- ✅ Fraud detection
- ✅ Unauthorized access patterns

---

### **3. Have I Been Pwned (HIBP) - API Access**

**Description:** While not a downloadable dataset, HIBP provides API access to check if accounts have been compromised in known breaches.

**Link:**
- **Website:** https://haveibeenpwned.com/
- **API Documentation:** https://haveibeenpwned.com/API/v3
- **Pwned Passwords API:** https://haveibeenpwned.com/API/v3#PwnedPasswords

**What's Available:**
- API to check email addresses against breach database
- Pwned passwords dataset (600M+ passwords)
- Breach information

**How to Use:**
```python
import requests

# Check if email was compromised
response = requests.get(
    f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}",
    headers={"hibp-api-key": "your-api-key"}
)
```

**Best For:**
- ✅ Validating compromised accounts
- ✅ Password breach analysis
- ✅ Real-time compromise checking

**Note:** Requires API key (free tier available)

---

### **4. Pwned Passwords Dataset**

**Description:** Over 600 million real-world passwords exposed in data breaches.

**Link:**
- **GitHub:** https://github.com/imavantikahere/Pwned-Password-Dataset
- **Official:** https://haveibeenpwned.com/Passwords

**What's Included:**
- 600M+ compromised passwords
- Hash format (SHA-1)
- Frequency counts

**Best For:**
- ✅ Password security analysis
- ✅ Credential compromise patterns
- ✅ Password strength evaluation

---

## 🎯 Best Datasets for Entity Compromise

### **1. CERT Insider Threat Dataset (Same as Above)**

**Why it's good for entities:**
- Contains entity-level activities (devices, IPs, resources)
- Tracks entity behavior patterns
- Includes entity compromise scenarios

---

### **2. Entity Resolution Benchmark Datasets**

**Description:** Real and synthetic datasets for entity resolution and behavior analysis.

**Link:**
- **Mendeley Data:** https://data.mendeley.com/datasets/4whpm32y47/1

**What's Included:**
- Real and synthetic entity datasets
- Ground truth for duplicate entities
- Entity behavior patterns
- Entity resolution workflows

**Best For:**
- ✅ Entity behavior analytics
- ✅ Entity resolution
- ✅ Entity anomaly detection

---

### **3. AWS Security Dataset (Synthetic)**

**Description:** While AWS doesn't provide official compromised datasets, you can find synthetic AWS security logs on various platforms.

**Where to Find:**
- **GitHub:** Search for "aws security logs dataset"
- **Kaggle:** Search for "AWS CloudTrail logs"
- **Synthetic Generators:** Use tools to generate realistic AWS logs

**Best For:**
- ✅ Cloud entity compromise
- ✅ AWS account compromise
- ✅ CloudTrail log analysis

---

## 📊 Additional Security Datasets

### **1. UNSW-NB15 Dataset**

**Link:** https://www.unsw.adfa.edu.au/unsw-canberra-cyber/cybersecurity/ADFA-NB15-Datasets/

**Description:** Network traffic dataset with various attack types including account compromise.

**Best For:**
- ✅ Network-based account compromise
- ✅ Intrusion detection
- ✅ Network anomaly detection

---

### **2. CICIDS2017 Dataset**

**Link:** https://www.unb.ca/cic/datasets/ids-2017.html

**Description:** Comprehensive intrusion detection dataset with various attack scenarios.

**Best For:**
- ✅ Intrusion detection
- ✅ Network security
- ✅ Attack pattern analysis

---

### **3. KDD Cup 1999 / NSL-KDD**

**Link:** 
- **NSL-KDD:** https://www.unb.ca/cic/datasets/nsl.html
- **Original:** http://kdd.ics.uci.edu/databases/kddcup99/kddcup99.html

**Description:** Classic intrusion detection dataset (though dated, still useful for baseline).

**Best For:**
- ✅ Baseline comparisons
- ✅ Intrusion detection research
- ✅ Academic research

---

## 🔧 How to Use These Datasets

### **Step 1: Download CERT Dataset (Recommended)**

```bash
# 1. Visit CERT website
https://www.cert.org/insider-threat-tools/datasets/

# 2. Register for free account
# 3. Download dataset (usually rar/zip file)
# 4. Extract files
```

### **Step 2: Process the Data**

```python
import pandas as pd

# Load CERT dataset
df = pd.read_csv('cert_data.csv')

# Filter for account compromise scenarios
compromised_accounts = df[df['threat_type'] == 'account_compromise']

# Extract features
features = ['user_id', 'timestamp', 'action', 'source_ip', 
            'resource', 'status', 'threat_label']
```

### **Step 3: Integrate with Your System**

```python
# Use with your CSV processor
from services.csv_processor import CSVProcessorService

processor = CSVProcessorService()
result = await processor.process_file(cert_data_csv)
```

---

## 📝 Dataset Comparison

| Dataset | Type | Size | Account Compromise | Entity Compromise | Ground Truth | Difficulty |
|---------|------|------|-------------------|-------------------|--------------|------------|
| **CERT Insider Threat** | Real | Large | ✅ Excellent | ✅ Excellent | ✅ Yes | Medium |
| **GoMask Account Takeover** | Synthetic | Medium | ✅ Good | ⚠️ Limited | ✅ Yes | Easy |
| **HIBP API** | Real | API | ✅ Good | ❌ No | ⚠️ Partial | Easy |
| **UNSW-NB15** | Real | Large | ⚠️ Limited | ⚠️ Limited | ✅ Yes | Medium |
| **CICIDS2017** | Real | Large | ⚠️ Limited | ⚠️ Limited | ✅ Yes | Medium |

---

## 🎯 Recommended Approach for Your Project

### **For Account Compromise:**

1. **Primary:** CERT Insider Threat Dataset
   - Most comprehensive
   - Real-world scenarios
   - Ground truth labels

2. **Secondary:** GoMask Account Takeover Dataset
   - Specific to account takeover
   - Easier to use
   - Good for testing

3. **Validation:** HIBP API
   - Real-time validation
   - Real breach data
   - API integration

### **For Entity Compromise:**

1. **Primary:** CERT Insider Threat Dataset
   - Entity-level activities included
   - Device/IP tracking
   - Resource access patterns

2. **Secondary:** Entity Resolution Benchmark
   - Entity behavior patterns
   - Entity relationships
   - Good for entity analytics

---

## 🔗 Direct Download Links

### **CERT Insider Threat Dataset:**
```
Official: https://www.cert.org/insider-threat-tools/datasets/
Registration: Required (free for research)
Format: RAR/ZIP files
Size: ~1-5 GB (depending on version)
```

### **GoMask Account Takeover:**
```
Website: https://gomask.ai/marketplace/datasets/account-takeover-detection
Access: May require registration
Format: CSV/JSON
```

### **HIBP API:**
```
API Docs: https://haveibeenpwned.com/API/v3
Registration: Free API key available
Rate Limit: 1 request per 1.5 seconds (free tier)
```

### **Pwned Passwords:**
```
GitHub: https://github.com/imavantikahere/Pwned-Password-Dataset
Direct: https://haveibeenpwned.com/Passwords
Format: Text file (SHA-1 hashes)
Size: ~10 GB
```

---

## 💡 Tips for Using These Datasets

### **1. Start with CERT Dataset**
- Most comprehensive for UEBA
- Real-world scenarios
- Well-documented

### **2. Combine Multiple Sources**
- Use CERT for training
- Use GoMask for testing
- Use HIBP for validation

### **3. Generate Synthetic Data**
- Use your existing test data as template
- Add compromise patterns
- Create edge cases

### **4. Data Preprocessing**
```python
# Common preprocessing steps
1. Normalize timestamps
2. Encode categorical features
3. Handle missing values
4. Create feature vectors
5. Split train/test sets
```

---

## 🚨 Important Notes

### **Privacy & Ethics:**
- ✅ Use datasets only for research/educational purposes
- ✅ Respect data privacy regulations
- ✅ Anonymize any real user data
- ✅ Don't share sensitive information

### **Data Quality:**
- ⚠️ Some datasets may be outdated
- ⚠️ Verify data quality before use
- ⚠️ Check for data bias
- ⚠️ Validate ground truth labels

### **Legal Compliance:**
- ✅ Check dataset licenses
- ✅ Follow terms of use
- ✅ Cite sources properly
- ✅ Don't redistribute without permission

---

## 📚 Additional Resources

### **Academic Papers:**
- "Detecting compromised email accounts via login behavior characterization"
- "Insider Threat Detection: A Systematic Review"
- "User and Entity Behavior Analytics: A Survey"

### **GitHub Repositories:**
- Search: "security dataset github"
- Search: "UEBA dataset"
- Search: "insider threat dataset"

### **Kaggle:**
- Search: "security logs"
- Search: "account compromise"
- Search: "anomaly detection"

---

## ✅ Quick Start Checklist

- [ ] Register for CERT Insider Threat Dataset
- [ ] Download CERT dataset
- [ ] Explore GoMask Account Takeover dataset
- [ ] Set up HIBP API key (optional)
- [ ] Process and integrate data
- [ ] Test with your risk scoring engine
- [ ] Validate model performance

---

## 🎯 For Your S-UEBA Project

**Recommended Workflow:**

1. **Week 1-2:** Download and explore CERT dataset
2. **Week 3:** Process data and extract features
3. **Week 4:** Train models on compromised accounts
4. **Week 5:** Test with GoMask dataset
5. **Week 6:** Validate with HIBP API (optional)
6. **Week 7+:** Integrate with your risk scoring engine

---

**Need Help?** Contact your team leader for dataset integration support.

---

*Last Updated: [Current Date]*  
*For questions or dataset recommendations, contact the team leader.*







