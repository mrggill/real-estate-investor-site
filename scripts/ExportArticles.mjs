import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const exportArticles = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('📊 Exporting articles from Supabase...');
  
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('date', { ascending: false });
    
  if (error) {
    console.error('❌ Error fetching articles:', error.message);
    return;
  }
  
  console.log(`✅ Found ${data.length} articles`);
  
  // Create export directory if it doesn't exist
  try {
    await fs.mkdir('./public/data', { recursive: true });
  } catch (err) {
    // Ignore if directory already exists
  }
  
  // Export as JSON
  await fs.writeFile('./public/data/articles.json', JSON.stringify(data, null, 2));
  console.log('📝 Exported to ./public/data/articles.json');
};

exportArticles().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});