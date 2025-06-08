// scripts/addSiteAuto.js
import { addSiteToConfigAuto } from './CombinedNewsScraper.mjs';

async function main() {
  const siteName = process.argv[2];
  const siteUrl = process.argv[3];

  if (!siteName || !siteUrl) {
    console.log('❌ Please provide both site name and URL');
    console.log('Usage: node scripts/addSiteAuto.js "Site Name" "https://site-url.com"');
    process.exit(1);
  }

  try {
    await addSiteToConfigAuto(siteName, siteUrl);
    console.log('\n✨ Done! You can now run the scraper to collect articles from this site.');
  } catch (error) {
    console.error('❌ Error adding site:', error.message);
    process.exit(1);
  }
}

main();