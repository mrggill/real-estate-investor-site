
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
    type: 'sklearn-random-forest',
    path: path.join(__dirname, '..', '..', '..', 'data', 'production', 'sklearn-rf-2025-06-02-22-32-27.joblib')
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
            
            const tmpFile = path.join(tmpDir, `article-${Date.now()}.json`);
            fs.writeFileSync(tmpFile, JSON.stringify({ title, content }));
            
            // Create Python command to run classifier
            const pythonScript = path.join(__dirname, '..', '..', '..', 'scripts', 'classify_single.py');
            
            // Create Python script if it doesn't exist
            if (!fs.existsSync(pythonScript)) {
                const scriptContent = `
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
                fs.writeFileSync(pythonScript, scriptContent);
            }
            
            // Run Python script
            const python = spawn('python', [pythonScript, MODEL_INFO.path, tmpFile]);
            
            let output = '';
            python.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            python.stderr.on('data', (data) => {
                logger.error(`Python error: ${data}`);
            });
            
            python.on('close', (code) => {
                // Delete temporary file
                fs.unlinkSync(tmpFile);
                
                if (code !== 0) {
                    logger.error(`Python process exited with code ${code}`);
                    // Fallback to true to avoid filtering out potentially relevant articles
                    resolve(true);
                    return;
                }
                
                try {
                    const result = JSON.parse(output);
                    logger.debug(`ML Relevance check: ${result.classification} (confidence: ${(result.confidence * 100).toFixed(2)}%)`);
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
