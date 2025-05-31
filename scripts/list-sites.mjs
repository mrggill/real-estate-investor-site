import { getSiteConfigs } from '../src/scrapers/modules/config-manager.mjs';

async function listSites() {
  const sites = await getSiteConfigs();
  
  console.log('Available sites:');
  sites.forEach((site, index) => {
    console.log(`${index + 1}. ${site.name} (${site.enabled ? 'Enabled' : 'Disabled'})`);
    console.log(`   URL: ${site.url}`);
  });
}

listSites();