
# Advanced model training script
import os
import json
import sys
import random
import numpy as np
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score, precision_recall_fscore_support
import joblib

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

print("Loading training data...")

# Paths
data_dir = "/Users/gurpreetgill/Projects/real-estate-investor-site/data"
relevant_dir = os.path.join(data_dir, "training", "relevant")
irrelevant_dir = os.path.join(data_dir, "training", "irrelevant")
models_dir = os.path.join(data_dir, "models")

# Ensure models directory exists
os.makedirs(models_dir, exist_ok=True)

# Load relevant articles
relevant_articles = []
for file in os.listdir(relevant_dir):
    if file.endswith('.json'):
        with open(os.path.join(relevant_dir, file), 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                content = data.get('content', '') or data.get('text', '')
                title = data.get('title', '')
                relevant_articles.append((title + " " + content, 1))
            except Exception as e:
                print(f"Error loading {file}: {e}")

# Load irrelevant articles
irrelevant_articles = []
for file in os.listdir(irrelevant_dir):
    if file.endswith('.json'):
        with open(os.path.join(irrelevant_dir, file), 'r', encoding='utf-8') as f:
            try:
                data = json.load(f)
                content = data.get('content', '') or data.get('text', '')
                title = data.get('title', '')
                irrelevant_articles.append((title + " " + content, 0))
            except Exception as e:
                print(f"Error loading {file}: {e}")

print(f"Loaded {len(relevant_articles)} relevant and {len(irrelevant_articles)} irrelevant articles")

# Combine and shuffle data
all_articles = relevant_articles + irrelevant_articles
random.shuffle(all_articles)

# Split into texts and labels
texts = [article[0] for article in all_articles]
labels = [article[1] for article in all_articles]

# Split into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    texts, labels, test_size=0.2, random_state=42
)

print("Training model...")

# Create pipeline with TF-IDF and Random Forest
pipeline = Pipeline([
    ('tfidf', TfidfVectorizer(max_features=10000, ngram_range=(1, 2))),
    ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
])

# Train the model
pipeline.fit(X_train, y_train)

# Evaluate the model
print("Evaluating model...")
y_pred = pipeline.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)
precision, recall, f1, _ = precision_recall_fscore_support(y_test, y_pred, average='binary')

print(f"Accuracy: {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall: {recall:.4f}")
print(f"F1 Score: {f1:.4f}")

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Irrelevant', 'Relevant']))

# Save the model
model_path = os.path.join(models_dir, f"sklearn-rf-{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}.joblib")
joblib.dump(pipeline, model_path)
print(f"Model saved to {model_path}")

# Save model metadata
metadata = {
    'modelPath': model_path,
    'type': 'sklearn-random-forest',
    'trainedOn': datetime.now().isoformat(),
    'performance': {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1': float(f1)
    },
    'trainingSize': {
        'relevant': len(relevant_articles),
        'irrelevant': len(irrelevant_articles),
        'total': len(all_articles)
    }
}

# Save as current model
with open(os.path.join(models_dir, 'current-model.json'), 'w') as f:
    json.dump(metadata, f, indent=2)

print("Model metadata saved")
print("Training complete!")
