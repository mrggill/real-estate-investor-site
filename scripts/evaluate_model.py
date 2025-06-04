
# Model evaluation script with cross-validation
import os
import json
import sys
import random
import numpy as np
from sklearn.model_selection import cross_val_score, cross_validate
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

# Load the model
model_path = "/Users/gurpreetgill/Projects/real-estate-investor-site/data/models/sklearn-rf-2025-06-02-22-32-27.joblib"
print(f"Loading model from {model_path}")
model = joblib.load(model_path)

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

# Perform cross-validation
print("Running cross-validation...")
cv_results = cross_validate(
    model, texts, labels, 
    cv=5, 
    scoring=['accuracy', 'precision', 'recall', 'f1']
)

# Print results
print("\nCross-validation Results:")
print(f"Accuracy: {np.mean(cv_results['test_accuracy']):.4f} (±{np.std(cv_results['test_accuracy']):.4f})")
print(f"Precision: {np.mean(cv_results['test_precision']):.4f} (±{np.std(cv_results['test_precision']):.4f})")
print(f"Recall: {np.mean(cv_results['test_recall']):.4f} (±{np.std(cv_results['test_recall']):.4f})")
print(f"F1 Score: {np.mean(cv_results['test_f1']):.4f} (±{np.std(cv_results['test_f1']):.4f})")

# Print detailed fold results
for i in range(5):
    print(f"\nFold {i+1}:")
    print(f"Accuracy: {cv_results['test_accuracy'][i]:.4f}")
    print(f"Precision: {cv_results['test_precision'][i]:.4f}")
    print(f"Recall: {cv_results['test_recall'][i]:.4f}")
    print(f"F1: {cv_results['test_f1'][i]:.4f}")

print("\nEvaluation complete!")
