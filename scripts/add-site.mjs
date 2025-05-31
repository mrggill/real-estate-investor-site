import readline from 'readline';
import { addSiteToConfig } from '../src/scrapers/modules/config-manager.mjs';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptUser() {
  const siteName = await new Promise(resolve => {
    rl.question('Enter site name: ', answer => resolve(answer));
  });
  
  const siteUrl = await new Promise(resolve => {
    rl.question('Enter site URL: ', answer => resolve(answer));
  });
  
  const enabledResponse = await new Promise(resolve => {
    rl.question('Enable this site? (Y/n): ', answer => resolve(answer || 'y'));
  });
  
  const enabled = enabledResponse.toLowerCase() !== 'n';
  
  await addSiteToConfig(siteName, siteUrl, { enabled });
  console.log(`Site "${siteName}" added successfully!`);
  
  rl.close();
}

promptUser();