// scripts/DeleteOldArticles.mjs

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const deleteOldArticles = async () => {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('🔍 Counting old articles...');
  
  // First, count how many articles will be deleted
  const { count, error: countError } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .lt('date', '2023-01-01');
    
  if (countError) {
    console.error('❌ Error counting old articles:', countError.message);
    return;
  }
  
  console.log(`🗑️ Found ${count} articles before January 1, 2023 to delete`);
  
  if (count === 0) {
    console.log('✅ No old articles found. Nothing to delete.');
    return;
  }
  
  // Confirm with user (uncomment this section if you want a confirmation step)
  /*
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    readline.question(`Are you sure you want to delete ${count} articles? (y/n) `, resolve);
  });
  readline.close();
  
  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('Operation cancelled by user.');
    return;
  }
  */
  
  // Delete the old articles
  const { error: deleteError } = await supabase
    .from('articles')
    .delete()
    .lt('date', '2023-01-01');
    
  if (deleteError) {
    console.error('❌ Error deleting old articles:', deleteError.message);
    return;
  }
  
  console.log(`✅ Successfully deleted ${count} articles before January 1, 2023`);
};

deleteOldArticles().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});