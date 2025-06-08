import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Read the articles from your scraped data file
    const dataPath = path.join(process.cwd(), 'public', 'data', 'articles.json');
    
    // Check if file exists first
    try {
      await fs.access(dataPath);
    } catch {
      console.log('Articles file does not exist yet, returning empty array');
      return NextResponse.json([], { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        }
      });
    }
    
    const articlesData = await fs.readFile(dataPath, 'utf8');
    
    // Parse the JSON data
    const articles = JSON.parse(articlesData);
    
    // Return the articles as JSON with CORS headers
    return NextResponse.json(articles, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      }
    });
  } catch (error) {  // Make sure this says 'error' not 'erorr'
  console.error('Error reading articles:', error);
  
  return NextResponse.json(
    { 
      error: 'Failed to fetch articles', 
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : 'Internal server error'
    },
    { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
      }
    }
  );
}
}