import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Read the articles from your scraped data file
    const dataPath = path.join(process.cwd(), 'public', 'data', 'articles.json');
    const articlesData = await fs.readFile(dataPath, 'utf8');
    
    // Parse the JSON data
    const articles = JSON.parse(articlesData);
    
    // Find the specific article by ID
    const article = articles.find((a: any) => a.id === id);
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }
    
    // Return the article as JSON
    return NextResponse.json(article);
  } catch (error) {
    console.error('Error reading article:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch article', details: error.message },
      { status: 500 }
    );
  }
}