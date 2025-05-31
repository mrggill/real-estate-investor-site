// src/tools/model-trainer.mjs

import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import logger from '../scrapers/utils/logger.mjs';
import natural from 'natural'; // You'll need to npm install natural
import { exec } from 'child_process';
import { promisify } from 'util';

// Convert exec to promise-based
const execAsync = promisify(exec);

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define paths
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const TRAINING_DIR = path.join(DATA_DIR, 'training');
const RELEVANT_DIR = path.join(TRAINING_DIR, 'relevant');
const IRRELEVANT_DIR = path.join(TRAINING_DIR, 'irrelevant');
const FEATURES_FILE = path.join(TRAINING_DIR, 'features.json');
const MODELS_DIR = path.join(DATA_DIR, 'models');
const PYTHON_SCRIPTS_DIR = path.join(__dirname, '..', '..', 'scripts');

// Create interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Ask a question and get user input
 * @param {string} question - Question to ask
 * @returns {Promise<string>} - User's answer
 */
const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
};

/**
 * Initialize the directory structure
 */
const initializeDirectories = async () => {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.mkdir(MODELS_DIR, { recursive: true });
        await fs.mkdir(PYTHON_SCRIPTS_DIR, { recursive: true });
        
        logger.success("Model directories initialized");
    } catch (err) {
        logger.error("Error initializing directories", err);
        throw err;
    }
};

/**
 * Main function for Model Training & Testing
 */
const modelTrainer = async () => {
    try {
        await initializeDirectories();
        await logger.init();
        logger.section("MODEL TRAINING & TESTING");
        
        // Display the menu
        console.log("\nMODEL TRAINING & TESTING OPTIONS:");
        console.log("1. Train basic model");
        console.log("2. Train advanced model (requires Python)");
        console.log("3. Evaluate model performance");
        console.log("4. Test model on new articles");
        console.log("5. Deploy model to production");
        console.log("6. Compare different models");
        console.log("7. Return to main menu");
        
        const choice = await askQuestion("\nSelect an option (1-7): ");
        
        switch (choice) {
            case '1':
                await trainBasicModel();
                break;
            case '2':
                await trainAdvancedModel();
                break;
            case '3':
                await evaluateModel();
                break;
            case '4':
                await testModel();
                break;
            case '5':
                await deployModel();
                break;
            case '6':
                await compareModels();
                break;
            case '7':
                logger.info("Returning to main menu");
                rl.close();
                return;
            default:
                logger.warning("Invalid option selected");
                break;
        }
        
        rl.close();
    } catch (err) {
        logger.error("Error in Model Trainer", err);
        rl.close();
    }
};

/**
 * Create and save a basic Naive Bayes classifier using Node.js and natural
 */
const trainBasicModel = async () => {
    try {
        logger.info("Preparing to train a basic Naive Bayes classifier...");
        
        // Check if we have training data
        const relevantFiles = await fs.readdir(RELEVANT_DIR);
        const irrelevantFiles = await fs.readdir(IRRELEVANT_DIR);
        
        if (relevantFiles.length === 0 || irrelevantFiles.length === 0) {
            logger.error("Insufficient training data. Please label more articles first.");
            logger.info(`Current dataset: ${relevantFiles.length} relevant, ${irrelevantFiles.length} irrelevant articles`);
            return;
        }
        
        logger.info(`Using ${relevantFiles.length} relevant and ${irrelevantFiles.length} irrelevant articles for training.`);
        
        // Load or initialize features from labeled data
        let features;
        try {
            features = JSON.parse(await fs.readFile(FEATURES_FILE, 'utf8'));
        } catch (err) {
            logger.warning("Features file not found. Generating new features...");
            await generateFeatures();
            features = JSON.parse(await fs.readFile(FEATURES_FILE, 'utf8'));
        }
        
        // Create a Naive Bayes classifier
        const classifier = new natural.BayesClassifier();
        
        // Train with relevant articles
        logger.info("Training on relevant articles...");
        for (const file of relevantFiles) {
            try {
                const filePath = path.join(RELEVANT_DIR, file);
                const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                const content = articleData.content || articleData.text || '';
                const title = articleData.title || '';
                
                // Add document with appropriate weight
                classifier.addDocument(title + " " + content, 'relevant');
            } catch (err) {
                logger.error(`Error processing relevant file ${file}`, err);
            }
        }
        
        // Train with irrelevant articles
        logger.info("Training on irrelevant articles...");
        for (const file of irrelevantFiles) {
            try {
                const filePath = path.join(IRRELEVANT_DIR, file);
                const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                const content = articleData.content || articleData.text || '';
                const title = articleData.title || '';
                
                // Add document
                classifier.addDocument(title + " " + content, 'irrelevant');
            } catch (err) {
                logger.error(`Error processing irrelevant file ${file}`, err);
            }
        }
        
        // Train the classifier
        logger.info("Training classifier...");
        classifier.train();
        
        // Save the classifier
        const modelPath = path.join(MODELS_DIR, `naive-bayes-${new Date().toISOString().replace(/:/g, '-')}.json`);
        await classifier.save(modelPath);
        
        // Save current model reference
        await fs.writeFile(path.join(MODELS_DIR, 'current-model.json'), JSON.stringify({
            modelPath,
            type: 'naive-bayes',
            trainedOn: new Date().toISOString(),
            trainingSize: {
                relevant: relevantFiles.length,
                irrelevant: irrelevantFiles.length
            }
        }, null, 2));
        
        logger.success(`Model trained and saved to ${modelPath}`);
        
        // Perform a quick self-test on training data
        let correctRelevant = 0;
        let correctIrrelevant = 0;
        
        // Test on a sample of relevant articles
        const relevantSample = relevantFiles.slice(0, Math.min(10, relevantFiles.length));
        for (const file of relevantSample) {
            const filePath = path.join(RELEVANT_DIR, file);
            const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
            const content = articleData.content || articleData.text || '';
            const title = articleData.title || '';
            
            const classification = classifier.classify(title + " " + content);
            if (classification === 'relevant') {
                correctRelevant++;
            }
        }
        
        // Test on a sample of irrelevant articles
        const irrelevantSample = irrelevantFiles.slice(0, Math.min(10, irrelevantFiles.length));
        for (const file of irrelevantSample) {
            const filePath = path.join(IRRELEVANT_DIR, file);
            const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
            const content = articleData.content || articleData.text || '';
            const title = articleData.title || '';
            
            const classification = classifier.classify(title + " " + content);
            if (classification === 'irrelevant') {
                correctIrrelevant++;
            }
        }
        
        console.log("\nQuick self-test results:");
        console.log(`Accuracy on relevant articles: ${(correctRelevant / relevantSample.length * 100).toFixed(2)}%`);
        console.log(`Accuracy on irrelevant articles: ${(correctIrrelevant / irrelevantSample.length * 100).toFixed(2)}%`);
        console.log(`Overall accuracy: ${((correctRelevant + correctIrrelevant) / (relevantSample.length + irrelevantSample.length) * 100).toFixed(2)}%`);
        
        await askQuestion("\nPress Enter to continue...");
    } catch (err) {
        logger.error("Error training basic model", err);
    }
};

/**
 * Train an advanced model using Python and TensorFlow/scikit-learn
 */
const trainAdvancedModel = async () => {
    try {
        logger.info("Preparing to train an advanced model using Python...");
        
        // Check for Python
        let pythonCommand = 'python3';
        try {
            await execAsync('python3 --version');
        } catch (err) {
            try {
                await execAsync('python --version');
                pythonCommand = 'python';
            } catch (err2) {
                logger.error("Python is not installed or not in PATH. Please install Python 3.x to use this feature.");
                return;
            }
        }
        
        // Check if we have training data
        const relevantFiles = await fs.readdir(RELEVANT_DIR);
        const irrelevantFiles = await fs.readdir(IRRELEVANT_DIR);
        
        if (relevantFiles.length === 0 || irrelevantFiles.length === 0) {
            logger.error("Insufficient training data. Please label more articles first.");
            return;
        }
        
        // Create Python script for training
        const pythonScriptPath = path.join(PYTHON_SCRIPTS_DIR, 'train_model.py');
        
        const pythonScript = `
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
data_dir = "${DATA_DIR.replace(/\\/g, '\\\\')}"
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

print("\\nClassification Report:")
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
`;

        // Write the Python script
        await fs.writeFile(pythonScriptPath, pythonScript);
        
        logger.info("Python script created. Starting training process...");
        
        // Run the Python script
        try {
            const { stdout, stderr } = await execAsync(`${pythonCommand} ${pythonScriptPath}`);
            console.log(stdout);
            if (stderr) {
                console.error(stderr);
            }
        } catch (err) {
            logger.error(`Error running Python script: ${err.message}`);
            return;
        }
        
        logger.success("Advanced model training completed!");
        await askQuestion("\nPress Enter to continue...");
    } catch (err) {
        logger.error("Error training advanced model", err);
    }
};

/**
 * Evaluate the current model's performance
 */
const evaluateModel = async () => {
    try {
        // Check if a model exists
        try {
            await fs.access(path.join(MODELS_DIR, 'current-model.json'));
        } catch (err) {
            logger.error("No trained model found. Please train a model first.");
            return;
        }
        
        // Load model metadata
        const modelMeta = JSON.parse(await fs.readFile(path.join(MODELS_DIR, 'current-model.json'), 'utf8'));
        
        console.log("\nEVALUATING MODEL:");
        console.log(`Model type: ${modelMeta.type}`);
        console.log(`Trained on: ${modelMeta.trainedOn}`);
        console.log(`Training dataset size: ${modelMeta.trainingSize.relevant} relevant, ${modelMeta.trainingSize.irrelevant} irrelevant articles`);
        
        if (modelMeta.performance) {
            console.log("\nPerformance metrics from training:");
            console.log(`Accuracy: ${(modelMeta.performance.accuracy * 100).toFixed(2)}%`);
            console.log(`Precision: ${(modelMeta.performance.precision * 100).toFixed(2)}%`);
            console.log(`Recall: ${(modelMeta.performance.recall * 100).toFixed(2)}%`);
            console.log(`F1 Score: ${(modelMeta.performance.f1 * 100).toFixed(2)}%`);
        }
        
        const evaluationType = await askQuestion("\nWould you like to perform: \n1. Cross-validation \n2. Test on new data \nSelect option (1-2): ");
        
        if (evaluationType === '1') {
            // Cross-validation
            if (modelMeta.type === 'naive-bayes') {
                await evaluateWithCrossValidation(modelMeta);
            } else if (modelMeta.type.startsWith('sklearn')) {
                await evaluatePythonModelWithCrossValidation(modelMeta);
            }
        } else if (evaluationType === '2') {
            // Test on new data
            const testDataPath = await askQuestion("\nEnter path to test data directory: ");
            
            if (!testDataPath || testDataPath.trim() === '') {
                logger.warning("No test data path provided");
                return;
            }
            
            if (modelMeta.type === 'naive-bayes') {
                await evaluateOnNewData(modelMeta, testDataPath);
            } else if (modelMeta.type.startsWith('sklearn')) {
                await evaluatePythonModelOnNewData(modelMeta, testDataPath);
            }
        } else {
            logger.warning("Invalid option selected");
        }
    } catch (err) {
        logger.error("Error evaluating model", err);
    }
};

/**
 * Evaluate a JS model using cross-validation
 */
const evaluateWithCrossValidation = async (modelMeta) => {
    try {
        logger.info("Running cross-validation on Naive Bayes classifier...");
        
        // Load all relevant articles
        const relevantFiles = await fs.readdir(RELEVANT_DIR);
        const relevantArticles = [];
        
        for (const file of relevantFiles) {
            try {
                const filePath = path.join(RELEVANT_DIR, file);
                const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                const content = articleData.content || articleData.text || '';
                const title = articleData.title || '';
                
                relevantArticles.push({
                    id: file,
                    text: title + " " + content,
                    label: 'relevant'
                });
            } catch (err) {
                logger.error(`Error loading relevant file ${file}`, err);
            }
        }
        
        // Load all irrelevant articles
        const irrelevantFiles = await fs.readdir(IRRELEVANT_DIR);
        const irrelevantArticles = [];
        
        for (const file of irrelevantFiles) {
            try {
                const filePath = path.join(IRRELEVANT_DIR, file);
                const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                const content = articleData.content || articleData.text || '';
                const title = articleData.title || '';
                
                irrelevantArticles.push({
                    id: file,
                    text: title + " " + content,
                    label: 'irrelevant'
                });
            } catch (err) {
                logger.error(`Error loading irrelevant file ${file}`, err);
            }
        }
        
        // Combine all articles
        const allArticles = [...relevantArticles, ...irrelevantArticles];
        
        // Shuffle the articles
        const shuffled = [...allArticles].sort(() => 0.5 - Math.random());
        
        // Perform k-fold cross-validation (k=5)
        const k = 5;
        const foldSize = Math.floor(shuffled.length / k);
        
        let totalAccuracy = 0;
        let totalPrecision = 0;
        let totalRecall = 0;
        
        for (let i = 0; i < k; i++) {
            logger.info(`Running fold ${i + 1}/${k}`);
            
            // Split data into training and testing
            const testingData = shuffled.slice(i * foldSize, (i + 1) * foldSize);
            const trainingData = [
                ...shuffled.slice(0, i * foldSize),
                ...shuffled.slice((i + 1) * foldSize)
            ];
            
            // Create and train classifier
            const classifier = new natural.BayesClassifier();
            
            for (const article of trainingData) {
                classifier.addDocument(article.text, article.label);
            }
            
            classifier.train();
            
            // Test the classifier
            let correctCount = 0;
            let truePositives = 0;
            let falsePositives = 0;
            let falseNegatives = 0;
            
            for (const article of testingData) {
                const predicted = classifier.classify(article.text);
                
                if (predicted === article.label) {
                    correctCount++;
                }
                
                if (predicted === 'relevant' && article.label === 'relevant') {
                    truePositives++;
                } else if (predicted === 'relevant' && article.label === 'irrelevant') {
                    falsePositives++;
                } else if (predicted === 'irrelevant' && article.label === 'relevant') {
                    falseNegatives++;
                }
            }
            
            const accuracy = correctCount / testingData.length;
            const precision = truePositives / (truePositives + falsePositives) || 0;
            const recall = truePositives / (truePositives + falseNegatives) || 0;
            
            totalAccuracy += accuracy;
            totalPrecision += precision;
            totalRecall += recall;
            
            console.log(`Fold ${i + 1} - Accuracy: ${(accuracy * 100).toFixed(2)}%, Precision: ${(precision * 100).toFixed(2)}%, Recall: ${(recall * 100).toFixed(2)}%`);
        }
        
        // Calculate averages
        const avgAccuracy = totalAccuracy / k;
        const avgPrecision = totalPrecision / k;
        const avgRecall = totalRecall / k;
        const f1Score = 2 * (avgPrecision * avgRecall) / (avgPrecision + avgRecall) || 0;
        
        console.log("\nCross-validation complete!");
        console.log(`Average Accuracy: ${(avgAccuracy * 100).toFixed(2)}%`);
        console.log(`Average Precision: ${(avgPrecision * 100).toFixed(2)}%`);
        console.log(`Average Recall: ${(avgRecall * 100).toFixed(2)}%`);
        console.log(`F1 Score: ${(f1Score * 100).toFixed(2)}%`);
        
        await askQuestion("\nPress Enter to continue...");
    } catch (err) {
        logger.error("Error performing cross-validation", err);
    }
};

/**
 * Evaluate a Python model using cross-validation
 */
const evaluatePythonModelWithCrossValidation = async (modelMeta) => {
    try {
        logger.info("Running cross-validation on sklearn model...");
        
        // Create Python script for evaluation
        const pythonScriptPath = path.join(PYTHON_SCRIPTS_DIR, 'evaluate_model.py');
        
        const pythonScript = `
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
data_dir = "${DATA_DIR.replace(/\\/g, '\\\\')}"
relevant_dir = os.path.join(data_dir, "training", "relevant")
irrelevant_dir = os.path.join(data_dir, "training", "irrelevant")
models_dir = os.path.join(data_dir, "models")

# Load the model
model_path = "${modelMeta.modelPath.replace(/\\/g, '\\\\')}"
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
print("\\nCross-validation Results:")
print(f"Accuracy: {np.mean(cv_results['test_accuracy']):.4f} (±{np.std(cv_results['test_accuracy']):.4f})")
print(f"Precision: {np.mean(cv_results['test_precision']):.4f} (±{np.std(cv_results['test_precision']):.4f})")
print(f"Recall: {np.mean(cv_results['test_recall']):.4f} (±{np.std(cv_results['test_recall']):.4f})")
print(f"F1 Score: {np.mean(cv_results['test_f1']):.4f} (±{np.std(cv_results['test_f1']):.4f})")

# Print detailed fold results
for i in range(5):
    print(f"\\nFold {i+1}:")
    print(f"Accuracy: {cv_results['test_accuracy'][i]:.4f}")
    print(f"Precision: {cv_results['test_precision'][i]:.4f}")
    print(f"Recall: {cv_results['test_recall'][i]:.4f}")
    print(f"F1: {cv_results['test_f1'][i]:.4f}")

print("\\nEvaluation complete!")
`;
        
        // Write the Python script
        await fs.writeFile(pythonScriptPath, pythonScript);
        
        logger.info("Python evaluation script created. Starting evaluation process...");
        
        // Determine Python command
        let pythonCommand = 'python3';
        try {
            await execAsync('python3 --version');
        } catch (err) {
            pythonCommand = 'python';
        }
        
        // Run the Python script
        try {
            const { stdout, stderr } = await execAsync(`${pythonCommand} ${pythonScriptPath}`);
            console.log(stdout);
            if (stderr) {
                console.error(stderr);
            }
        } catch (err) {
            logger.error(`Error running Python script: ${err.message}`);
            return;
        }
        
        logger.success("Cross-validation completed!");
        await askQuestion("\nPress Enter to continue...");
    } catch (err) {
        logger.error("Error evaluating model with cross-validation", err);
    }
};

/**
 * Test an existing model on new articles
 */
const testModel = async () => {
    try {
        // Check if a model exists
        try {
            await fs.access(path.join(MODELS_DIR, 'current-model.json'));
        } catch (err) {
            logger.error("No trained model found. Please train a model first.");
            return;
        }
        
        // Load model metadata
        const modelMeta = JSON.parse(await fs.readFile(path.join(MODELS_DIR, 'current-model.json'), 'utf8'));
        
        // Ask for path to new articles
        const articlesPath = await askQuestion("\nEnter path to directory with new articles: ");
        
        if (!articlesPath || articlesPath.trim() === '') {
            logger.warning("No articles path provided");
            return;
        }
        
        // Check if directory exists
        try {
            await fs.access(articlesPath);
        } catch (err) {
            logger.error(`Directory not found: ${articlesPath}`);
            return;
        }
        
        // Read all JSON files from the directory
        const files = await fs.readdir(articlesPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length === 0) {
            logger.warning("No JSON files found in the specified directory");
            return;
        }
        
        logger.info(`Found ${jsonFiles.length} articles to test`);
        
        if (modelMeta.type === 'naive-bayes') {
            // Load Naive Bayes classifier
            const classifier = natural.BayesClassifier.restore(
                JSON.parse(await fs.readFile(modelMeta.modelPath, 'utf8'))
            );
            
            // Process and classify each article
            const results = [];
            
            for (const file of jsonFiles) {
                try {
                    const filePath = path.join(articlesPath, file);
                    const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                    const content = articleData.content || articleData.text || '';
                    const title = articleData.title || '';
                    
                    const classification = classifier.classify(title + " " + content);
                    const probabilities = classifier.getClassifications(title + " " + content);
                    
                    // Calculate confidence score
                    const confidence = probabilities.find(p => p.label === classification)?.value || 0;
                    
                    results.push({
                        filename: file,
                        title,
                        classification,
                        confidence: confidence.toFixed(4),
                        preview: content.substring(0, 150) + '...'
                    });
                } catch (err) {
                    logger.error(`Error processing file ${file}`, err);
                }
            }
            
            // Display results
            console.log("\nClassification Results:");
            console.log("=".repeat(100));
            console.log(
                "Filename".padEnd(30) + 
                "Classification".padEnd(15) + 
                "Confidence".padEnd(15) + 
                "Title"
            );
            console.log("-".repeat(100));
            
            results.forEach(result => {
                console.log(
                    result.filename.padEnd(30) + 
                    result.classification.padEnd(15) + 
                    result.confidence.padEnd(15) + 
                    result.title.substring(0, 40)
                );
            });
            
            const relevantCount = results.filter(r => r.classification === 'relevant').length;
            const irrelevantCount = results.filter(r => r.classification === 'irrelevant').length;
            
            console.log("=".repeat(100));
            console.log(`Summary: ${relevantCount} relevant, ${irrelevantCount} irrelevant articles`);
            console.log(`Relevance ratio: ${(relevantCount / results.length * 100).toFixed(2)}%`);
            
            // Ask if user wants to save results
            const saveResults = await askQuestion("\nDo you want to save these classification results? (y/n): ");
            
            if (saveResults.toLowerCase() === 'y') {
                const resultsFile = path.join(DATA_DIR, `classification-results-${new Date().toISOString().replace(/:/g, '-')}.json`);
                
                await fs.writeFile(resultsFile, JSON.stringify({
                    model: modelMeta,
                    results,
                    summary: {
                        totalArticles: results.length,
                        relevantCount,
                        irrelevantCount,
                        relevanceRatio: relevantCount / results.length
                    },
                    timestamp: new Date().toISOString()
                }, null, 2));
                
                logger.success(`Results saved to ${resultsFile}`);
            }
        } else if (modelMeta.type.startsWith('sklearn')) {
            // Create temporary Python script for classification
            const pythonScriptPath = path.join(PYTHON_SCRIPTS_DIR, 'classify_articles.py');
            
            const pythonScript = `
# Script to classify new articles
import os
import json
import sys
import joblib
import numpy as np

# Paths
data_dir = "${DATA_DIR.replace(/\\/g, '\\\\')}"
models_dir = os.path.join(data_dir, "models")
articles_path = "${articlesPath.replace(/\\/g, '\\\\')}"

# Load the model
model_path = "${modelMeta.modelPath.replace(/\\/g, '\\\\')}"
print(f"Loading model from {model_path}")
model = joblib.load(model_path)

# Get all JSON files
json_files = [f for f in os.listdir(articles_path) if f.endswith('.json')]
print(f"Found {len(json_files)} articles to classify")

# Process each article
results = []
for file in json_files:
    try:
        with open(os.path.join(articles_path, file), 'r', encoding='utf-8') as f:
            data = json.load(f)
            content = data.get('content', '') or data.get('text', '')
            title = data.get('title', '')
            
            # Classify
            prediction = model.predict([title + " " + content])[0]
            confidence = float(np.max(model.predict_proba([title + " " + content])[0]))
            
            results.append({
                'filename': file,
                'title': title,
                'classification': 'relevant' if prediction == 1 else 'irrelevant',
                'confidence': round(confidence, 4),
                'preview': content[:150] + '...' if len(content) > 150 else content
            })
    except Exception as e:
        print(f"Error processing {file}: {e}")

# Display results
print("\\nClassification Results:")
print("=" * 100)
print(f"{'Filename':30}{'Classification':15}{'Confidence':15}Title")
print("-" * 100)

for result in results:
    print(f"{result['filename'][:30]:30}{result['classification']:15}{str(result['confidence']):15}{result['title'][:40]}")

# Calculate summary
relevant_count = sum(1 for r in results if r['classification'] == 'relevant')
irrelevant_count = sum(1 for r in results if r['classification'] == 'irrelevant')

print("=" * 100)
print(f"Summary: {relevant_count} relevant, {irrelevant_count} irrelevant articles")
print(f"Relevance ratio: {relevant_count / len(results) * 100:.2f}%")

# Save results
result_data = {
    'model': {
        'type': "${modelMeta.type}",
        'trainedOn': "${modelMeta.trainedOn}",
        'modelPath': model_path
    },
    'results': results,
    'summary': {
        'totalArticles': len(results),
        'relevantCount': relevant_count,
        'irrelevantCount': irrelevant_count,
        'relevanceRatio': relevant_count / len(results)
    },
    'timestamp': "${new Date().toISOString()}"
}

results_file = os.path.join(data_dir, f"classification-results-{result_data['timestamp'].replace(':', '-')}.json")
with open(results_file, 'w', encoding='utf-8') as f:
    json.dump(result_data, f, indent=2)

print(f"\\nResults saved to {results_file}")
`;
            
            // Write the Python script
            await fs.writeFile(pythonScriptPath, pythonScript);
            
            logger.info("Python classification script created. Starting classification...");
            
            // Determine Python command
            let pythonCommand = 'python3';
            try {
                await execAsync('python3 --version');
            } catch (err) {
                pythonCommand = 'python';
            }
            
            // Run the Python script
            try {
                const { stdout, stderr } = await execAsync(`${pythonCommand} ${pythonScriptPath}`);
                console.log(stdout);
                if (stderr) {
                    console.error(stderr);
                }
            } catch (err) {
                logger.error(`Error running Python script: ${err.message}`);
                return;
            }
        }
        
        await askQuestion("\nPress Enter to continue...");
    } catch (err) {
        logger.error("Error testing model", err);
    }
};

/**
 * Deploy the trained model to production
 */
const deployModel = async () => {
    try {
        // Check if a model exists
        try {
            await fs.access(path.join(MODELS_DIR, 'current-model.json'));
        } catch (err) {
            logger.error("No trained model found. Please train a model first.");
            return;
        }
        
        // Load model metadata
        const modelMeta = JSON.parse(await fs.readFile(path.join(MODELS_DIR, 'current-model.json'), 'utf8'));
        
        console.log("\nDEPLOY MODEL TO PRODUCTION");
        console.log(`Current model: ${modelMeta.type} (trained on ${modelMeta.trainedOn})`);
        
        if (modelMeta.performance) {
            console.log(`Performance: Accuracy: ${(modelMeta.performance.accuracy * 100).toFixed(2)}%, F1: ${(modelMeta.performance.f1 * 100).toFixed(2)}%`);
        }
        
        const confirmation = await askQuestion("\nDo you want to deploy this model to production? (y/n): ");
        
        if (confirmation.toLowerCase() !== 'y') {
            logger.info("Deployment cancelled");
            return;
        }
        
        // Create production directory if it doesn't exist
        const productionDir = path.join(DATA_DIR, 'production');
        await fs.mkdir(productionDir, { recursive: true });
        
        // Copy model to production
        const modelFilename = path.basename(modelMeta.modelPath);
        const prodModelPath = path.join(productionDir, modelFilename);
        
        await fs.copyFile(modelMeta.modelPath, prodModelPath);
        
        // Create production model metadata
        const prodModelMeta = {
            ...modelMeta,
            deployedOn: new Date().toISOString(),
            prodModelPath: prodModelPath
        };
        
        await fs.writeFile(path.join(productionDir, 'production-model.json'), JSON.stringify(prodModelMeta, null, 2));
        
        // Create relevance classifier module for sklearn models
        if (modelMeta.type.startsWith('sklearn')) {
            const relevanceCheckerCode = `
// src/scrapers/modules/ml-relevance-checker.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import logger from '../utils/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Model info
const MODEL_INFO = {
    type: '${modelMeta.type}',
    path: path.join(__dirname, '..', '..', '..', 'data', 'production', '${modelFilename}')
};

/**
 * Check if an article is relevant using the ML model
 * @param {Object} article - The article object
 * @returns {Promise<boolean>} - Whether the article is relevant
 */
const checkArticleRelevance = async (article) => {
    return new Promise((resolve, reject) => {
        try {
            // Get the article content
            const title = article.title || '';
            const content = article.content || article.text || '';
            
            // Create a temporary file to store the article
            const tmpDir = path.join(__dirname, '..', '..', '..', 'data', 'tmp');
            fs.mkdirSync(tmpDir, { recursive: true });
            
            const tmpFile = path.join(tmpDir, \`article-\${Date.now()}.json\`);
            fs.writeFileSync(tmpFile, JSON.stringify({ title, content }));
            
            // Create Python command to run classifier
            const pythonScript = path.join(__dirname, '..', '..', '..', 'scripts', 'classify_single.py');
            
            // Create Python script if it doesn't exist
            if (!fs.existsSync(pythonScript)) {
                const scriptContent = \`
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
\`;
                fs.writeFileSync(pythonScript, scriptContent);
            }
            
            // Run Python script
            const python = spawn('python', [pythonScript, MODEL_INFO.path, tmpFile]);
            
            let output = '';
            python.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            python.stderr.on('data', (data) => {
                logger.error(\`Python error: \${data}\`);
            });
            
            python.on('close', (code) => {
                // Delete temporary file
                fs.unlinkSync(tmpFile);
                
                if (code !== 0) {
                    logger.error(\`Python process exited with code \${code}\`);
                    // Fallback to true to avoid filtering out potentially relevant articles
                    resolve(true);
                    return;
                }
                
                try {
                    const result = JSON.parse(output);
                    logger.debug(\`ML Relevance check: \${result.classification} (confidence: \${(result.confidence * 100).toFixed(2)}%)\`);
                    resolve(result.classification === 'relevant');
                } catch (err) {
                    logger.error("Error parsing Python output", err);
                    // Fallback to true
                    resolve(true);
                }
            });
        } catch (err) {
            logger.error("Error checking article relevance with ML model", err);
            // Fallback to true
            resolve(true);
        }
    });
};

export default checkArticleRelevance;
`;
            
            // Create the relevance checker directory if it doesn't exist
            const modulesDir = path.join(__dirname, '..', 'scrapers', 'modules');
            await fs.mkdir(modulesDir, { recursive: true });
            
            // Write the relevance checker module
            await fs.writeFile(path.join(modulesDir, 'ml-relevance-checker.mjs'), relevanceCheckerCode);
            
            // Create the Python helper script for sklearn models
            const pythonScript = `
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
`;
            
            await fs.mkdir(path.join(__dirname, '..', '..', 'scripts'), { recursive: true });
            await fs.writeFile(path.join(__dirname, '..', '..', 'scripts', 'classify_single.py'), pythonScript);
        } else if (modelMeta.type === 'naive-bayes') {
            // Create relevance classifier module for Naive Bayes models
            const relevanceCheckerCode = `
// src/scrapers/modules/ml-relevance-checker.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import natural from 'natural';
import logger from '../utils/logger.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Model path
const MODEL_PATH = path.join(__dirname, '..', '..', '..', 'data', 'production', '${modelFilename}');

// Cache for classifier
let classifier = null;

/**
 * Initialize the classifier
 */
const initClassifier = async () => {
    try {
        if (!classifier) {
            logger.info("Loading machine learning model for relevance checking...");
            const modelData = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));
            classifier = natural.BayesClassifier.restore(modelData);
            logger.success("ML model loaded successfully");
        }
    } catch (err) {
        logger.error("Error loading ML model", err);
        throw err;
    }
};

/**
 * Check if an article is relevant using the ML model
 * @param {Object} article - The article object
 * @returns {boolean} - Whether the article is relevant
 */
const checkArticleRelevance = async (article) => {
    try {
        // Initialize classifier if needed
        if (!classifier) {
            await initClassifier();
        }
        
        // Get the article content
        const title = article.title || '';
        const content = article.content || article.text || '';
        
        // Classify the article
        const classification = classifier.classify(title + " " + content);
        const probabilities = classifier.getClassifications(title + " " + content);
        
        // Get the confidence score
        const confidence = probabilities.find(p => p.label === classification)?.value || 0;
        
        // Log the result
        logger.debug(\`ML Relevance check: \${classification} (confidence: \${(confidence * 100).toFixed(2)}%)\`);
        
        // Return true if the article is classified as relevant
        return classification === 'relevant';
    } catch (err) {
        logger.error("Error checking article relevance with ML model", err);
        // Fallback to true to avoid filtering out potentially relevant articles
        return true;
    }
};

export default checkArticleRelevance;
`;
            
            // Create the relevance checker directory if it doesn't exist
            const modulesDir = path.join(__dirname, '..', 'scrapers', 'modules');
            await fs.mkdir(modulesDir, { recursive: true });
            
            // Write the relevance checker module
            await fs.writeFile(path.join(modulesDir, 'ml-relevance-checker.mjs'), relevanceCheckerCode);
        }
        
        logger.success("Model deployed to production successfully!");
        logger.info(`Model available at: ${prodModelPath}`);
        logger.info("Created ML relevance checker module: src/scrapers/modules/ml-relevance-checker.mjs");
        
        console.log("\nTo use this model in your scraper, modify your scraper code to:");
        console.log(`
import mlRelevanceChecker from '../modules/ml-relevance-checker.mjs';

// ... in your article processing code ...
const isRelevant = await mlRelevanceChecker(article);
if (isRelevant) {
    // Process and save the article
} else {
    // Skip this article
}
`);
        
        await askQuestion("\nPress Enter to continue...");
    } catch (err) {
        logger.error("Error deploying model", err);
    }
};

/**
 * Compare different models
 */
const compareModels = async () => {
    try {
        // Get all model files
        const modelFiles = await fs.readdir(MODELS_DIR);
        const metaFiles = modelFiles.filter(file => file.endsWith('-model.json') || file === 'current-model.json');
        
        if (metaFiles.length === 0) {
            logger.error("No models found to compare");
            return;
        }
        
        // Load model metadata
        const models = [];
        for (const file of metaFiles) {
            try {
                const meta = JSON.parse(await fs.readFile(path.join(MODELS_DIR, file), 'utf8'));
                models.push({
                    ...meta,
                    filename: file
                });
            } catch (err) {
                logger.error(`Error loading model metadata: ${file}`, err);
            }
        }
        
        console.log("\nCOMPARE MODELS:");
        console.log("=".repeat(100));
        console.log(
            "Model Type".padEnd(25) + 
            "Trained On".padEnd(25) + 
            "Accuracy".padEnd(15) + 
            "Precision".padEnd(15) + 
            "Recall".padEnd(15) + 
            "F1 Score"
        );
        console.log("-".repeat(100));
        
        models.forEach(model => {
            const trainedOn = model.trainedOn ? new Date(model.trainedOn).toLocaleString() : 'Unknown';
            const accuracy = model.performance?.accuracy ? `${(model.performance.accuracy * 100).toFixed(2)}%` : 'N/A';
            const precision = model.performance?.precision ? `${(model.performance.precision * 100).toFixed(2)}%` : 'N/A';
            const recall = model.performance?.recall ? `${(model.performance.recall * 100).toFixed(2)}%` : 'N/A';
            const f1 = model.performance?.f1 ? `${(model.performance.f1 * 100).toFixed(2)}%` : 'N/A';
            
            console.log(
                model.type.padEnd(25) + 
                trainedOn.padEnd(25) + 
                accuracy.padEnd(15) + 
                precision.padEnd(15) + 
                recall.padEnd(15) + 
                f1
            );
        });
        
        console.log("=".repeat(100));
        
        await askQuestion("\nPress Enter to continue...");
    } catch (err) {
        logger.error("Error comparing models", err);
    }
};

/**
 * Evaluate a model on new data (for JS models)
 */
const evaluateOnNewData = async (modelMeta, testDataPath) => {
    try {
        // Load Naive Bayes classifier
        const classifier = natural.BayesClassifier.restore(
            JSON.parse(await fs.readFile(modelMeta.modelPath, 'utf8'))
        );
        
        // Read all JSON files from the directory
        const files = await fs.readdir(testDataPath);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length === 0) {
            logger.warning("No JSON files found in the specified directory");
            return;
        }
        
        logger.info(`Found ${jsonFiles.length} articles for evaluation`);
        
        // Process and classify each article
        const results = [];
        
        for (const file of jsonFiles) {
            try {
                const filePath = path.join(testDataPath, file);
                const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                const content = articleData.content || articleData.text || '';
                const title = articleData.title || '';
                
                const classification = classifier.classify(title + " " + content);
                const probabilities = classifier.getClassifications(title + " " + content);
                
                // Calculate confidence score
                const confidence = probabilities.find(p => p.label === classification)?.value || 0;
                
                results.push({
                    filename: file,
                    title,
                    classification,
                    confidence: confidence.toFixed(4)
                });
            } catch (err) {
                logger.error(`Error processing file ${file}`, err);
            }
        }
        
        // Display results summary
        const relevantCount = results.filter(r => r.classification === 'relevant').length;
        const irrelevantCount = results.filter(r => r.classification === 'irrelevant').length;
        
        console.log("\nEVALUATION RESULTS:");
        console.log(`Total articles: ${results.length}`);
        console.log(`Relevant: ${relevantCount} (${(relevantCount / results.length * 100).toFixed(2)}%)`);
        console.log(`Irrelevant: ${irrelevantCount} (${(irrelevantCount / results.length * 100).toFixed(2)}%)`);
        
        // Ask if user wants to save detailed results
        const saveResults = await askQuestion("\nDo you want to save detailed evaluation results? (y/n): ");
        
        if (saveResults.toLowerCase() === 'y') {
            const resultsFile = path.join(DATA_DIR, `evaluation-results-${new Date().toISOString().replace(/:/g, '-')}.json`);
            
            await fs.writeFile(resultsFile, JSON.stringify({
                model: modelMeta,
                results,
                summary: {
                    totalArticles: results.length,
                    relevantCount,
                    irrelevantCount,
                    relevanceRatio: relevantCount / results.length
                },
                timestamp: new Date().toISOString()
            }, null, 2));
            
            logger.success(`Detailed results saved to ${resultsFile}`);
        }
    } catch (err) {
        logger.error("Error evaluating on new data", err);
    }
};

/**
 * Evaluate a Python model on new data
 */
const evaluatePythonModelOnNewData = async (modelMeta, testDataPath) => {
    try {
        // Create Python script for evaluation
        const pythonScriptPath = path.join(PYTHON_SCRIPTS_DIR, 'evaluate_on_new_data.py');
        
        const pythonScript = `
import os
import json
import sys
import joblib
import numpy as np
from datetime import datetime

# Paths
data_dir = "${DATA_DIR.replace(/\\/g, '\\\\')}"
test_data_path = "${testDataPath.replace(/\\/g, '\\\\')}"

# Load the model
model_path = "${modelMeta.modelPath.replace(/\\/g, '\\\\')}"
print(f"Loading model from {model_path}")
model = joblib.load(model_path)

# Get all JSON files
json_files = [f for f in os.listdir(test_data_path) if f.endswith('.json')]
print(f"Found {len(json_files)} articles for evaluation")

# Process each article
results = []
for file in json_files:
    try:
        with open(os.path.join(test_data_path, file), 'r', encoding='utf-8') as f:
            data = json.load(f)
            content = data.get('content', '') or data.get('text', '')
            title = data.get('title', '')
            
            # Classify
            prediction = model.predict([title + " " + content])[0]
            confidence = float(np.max(model.predict_proba([title + " " + content])[0]))
            
            results.append({
                'filename': file,
                'title': title,
                'classification': 'relevant' if prediction == 1 else 'irrelevant',
                'confidence': round(confidence, 4)
            })
    except Exception as e:
        print(f"Error processing {file}: {e}")

# Calculate summary
relevant_count = sum(1 for r in results if r['classification'] == 'relevant')
irrelevant_count = sum(1 for r in results if r['classification'] == 'irrelevant')

# Display results
print("\\nEVALUATION RESULTS:")
print(f"Total articles: {len(results)}")
print(f"Relevant: {relevant_count} ({relevant_count / len(results) * 100:.2f}%)")
print(f"Irrelevant: {irrelevant_count} ({irrelevant_count / len(results) * 100:.2f}%)")

# Save results
results_data = {
    'model': {
        'type': "${modelMeta.type}",
        'trainedOn': "${modelMeta.trainedOn}",
        'modelPath': model_path
    },
    'results': results,
    'summary': {
        'totalArticles': len(results),
        'relevantCount': relevant_count,
        'irrelevantCount': irrelevant_count,
        'relevanceRatio': relevant_count / len(results)
    },
    'timestamp': datetime.now().isoformat()
}

results_file = os.path.join(data_dir, f"evaluation-results-{datetime.now().strftime('%Y-%m-%d-%H-%M-%S')}.json")
with open(results_file, 'w', encoding='utf-8') as f:
    json.dump(results_data, f, indent=2)

print(f"\\nDetailed results saved to {results_file}")
`;
        
        // Write the Python script
        await fs.writeFile(pythonScriptPath, pythonScript);
        
        logger.info("Python evaluation script created. Starting evaluation...");
        
        // Determine Python command
        let pythonCommand = 'python3';
        try {
            await execAsync('python3 --version');
        } catch (err) {
            pythonCommand = 'python';
        }
        
        // Run the Python script
        try {
            const { stdout, stderr } = await execAsync(`${pythonCommand} ${pythonScriptPath}`);
            console.log(stdout);
            if (stderr) {
                console.error(stderr);
            }
        } catch (err) {
            logger.error(`Error running Python script: ${err.message}`);
            return;
        }
    } catch (err) {
        logger.error("Error evaluating Python model on new data", err);
    }
};

/**
 * Helper function to generate features from labeled data
 */
const generateFeatures = async () => {
    try {
        logger.info("Generating features from labeled data...");
        
        // Read all relevant articles
        const relevantFiles = await fs.readdir(RELEVANT_DIR);
        
        // Read all irrelevant articles
        const irrelevantFiles = await fs.readdir(IRRELEVANT_DIR);
        
        if (relevantFiles.length === 0 && irrelevantFiles.length === 0) {
            logger.warning("No labeled data found");
            return;
        }
        
        // Initialize TF-IDF
        const tfidf = new natural.TfIdf();
        
        // Add relevant documents
        for (const file of relevantFiles) {
            try {
                const filePath = path.join(RELEVANT_DIR, file);
                const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                const content = articleData.content || articleData.text || '';
                tfidf.addDocument(content);
            } catch (err) {
                logger.error(`Error processing relevant file ${file}`, err);
            }
        }
        
        // Extract most significant terms from relevant documents
        const relevantKeywords = new Set();
        for (let i = 0; i < Math.min(tfidf.documents.length, 50); i++) {
            const terms = tfidf.listTerms(i).slice(0, 20); // Get top 20 terms
            terms.forEach(term => {
                relevantKeywords.add(term.term);
            });
        }
        
        // Initialize a new TF-IDF for irrelevant documents
        const irrelevantTfidf = new natural.TfIdf();
        
        // Add irrelevant documents
        for (const file of irrelevantFiles) {
            try {
                const filePath = path.join(IRRELEVANT_DIR, file);
                const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                const content = articleData.content || articleData.text || '';
                irrelevantTfidf.addDocument(content);
            } catch (err) {
                logger.error(`Error processing irrelevant file ${file}`, err);
            }
        }
        
        // Extract most significant terms from irrelevant documents
        const irrelevantKeywords = new Set();
        for (let i = 0; i < Math.min(irrelevantTfidf.documents.length, 50); i++) {
            const terms = irrelevantTfidf.listTerms(i).slice(0, 20); // Get top 20 terms
            terms.forEach(term => {
                irrelevantKeywords.add(term.term);
            });
        }
        
        // Create word frequency dictionary
        const wordFrequencies = {};
        
        // Process relevant documents for word frequencies
        for (const file of relevantFiles) {
            try {
                const filePath = path.join(RELEVANT_DIR, file);
                const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                const content = articleData.content || articleData.text || '';
                
                const tokenizer = new natural.WordTokenizer();
                const tokens = tokenizer.tokenize(content.toLowerCase());
                
                // Count word frequencies
                tokens.forEach(word => {
                    if (!wordFrequencies[word]) {
                        wordFrequencies[word] = { relevant: 0, irrelevant: 0 };
                    }
                    wordFrequencies[word].relevant++;
                });
            } catch (err) {
                logger.error(`Error processing file ${file} for word frequencies`, err);
            }
        }
        
        // Process irrelevant documents for word frequencies
        for (const file of irrelevantFiles) {
            try {
                const filePath = path.join(IRRELEVANT_DIR, file);
                const articleData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                const content = articleData.content || articleData.text || '';
                
                const tokenizer = new natural.WordTokenizer();
                const tokens = tokenizer.tokenize(content.toLowerCase());
                
                // Count word frequencies
                tokens.forEach(word => {
                    if (!wordFrequencies[word]) {
                        wordFrequencies[word] = { relevant: 0, irrelevant: 0 };
                    }
                    wordFrequencies[word].irrelevant++;
                });
            } catch (err) {
                logger.error(`Error processing file ${file} for word frequencies`, err);
            }
        }
        
        // Save features to file
        const features = {
            wordFrequencies,
            relevantKeywords: Array.from(relevantKeywords),
            irrelevantKeywords: Array.from(irrelevantKeywords),
            stats: {
                totalRelevant: relevantFiles.length,
                totalIrrelevant: irrelevantFiles.length,
                lastUpdated: new Date().toISOString()
            }
        };
        
        await fs.writeFile(FEATURES_FILE, JSON.stringify(features, null, 2));
        
        logger.success("Features generated successfully");
        return features;
    } catch (err) {
        logger.error("Error generating features", err);
        throw err;
    }
};

// Export the functions for use in other modules
export {
    modelTrainer,
    trainBasicModel,
    trainAdvancedModel,
    evaluateModel,
    testModel,
    deployModel,
    compareModels,
    generateFeatures
};

// Run the trainer when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    modelTrainer().catch(err => {
        console.error("Error in Model Trainer:", err);
        process.exit(1);
    });
}