import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    // Read the articles from your scraped data file
    // Adjust the path based on where your scraper saves the data
    const dataPath = path.join(process.cwd(), 'public', 'data', 'articles.json');
    const articlesData = await fs.readFile(dataPath, 'utf8');
    
    // Parse the JSON data
    const articles = JSON.parse(articlesData);
    
    // Return the articles as JSON
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error reading articles:', error);
    
    // Return an error response
    return NextResponse.json(
      { error: 'Failed to fetch articles', details: error.message },
      { status: 500 }
    );
  }
}