
import sys
import os
import json
import joblib

# Get arguments
model_path = sys.argv[1]
article_path = sys.argv[2]

# Load model
model = joblib.load(model_path)

# Load article
with open(article_path, 'r') as f:
    article = json.load(f)

title = article.get('title', '')
content = article.get('content', '')
text = title + " " + content

# Classify
prediction = model.predict([text])[0]
confidence = float(model.predict_proba([text])[0][prediction])

# Output result
result = {
    'classification': 'relevant' if prediction == 1 else 'irrelevant',
    'confidence': confidence
}

print(json.dumps(result))
