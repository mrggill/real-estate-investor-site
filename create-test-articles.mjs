// create-test-articles.mjs
import fs from 'fs/promises';
import path from 'path';

// Create test directory
await fs.mkdir('data/test', { recursive: true });

// Sample test articles for real estate investment (adjust based on your domain)
const testArticles = [
  {
    title: "New Real Estate Investment Opportunities in Downtown Area",
    content: "Investors are showing increased interest in downtown real estate properties as the market continues to evolve. Recent developments include mixed-use buildings that combine residential and commercial spaces, offering attractive returns for savvy investors. Market analysts predict continued growth in property values over the next five years, making this an opportune time for real estate investment. The downtown area has seen significant infrastructure improvements, including new transit connections and business districts that enhance property appeal.",
    url: "https://example.com/real-estate-investment-1",
    date: "2025-05-16",
    expectedClass: "relevant"
  },
  {
    title: "Celebrity Chef Opens New Restaurant Chain",
    content: "A famous celebrity chef announced the opening of five new restaurant locations across the country. The new establishments will feature farm-to-table cuisine with a focus on locally sourced ingredients. Food critics are already praising the innovative menu and elegant dining atmosphere. The chef's previous restaurants have received multiple awards and recognition from culinary institutions.",
    url: "https://example.com/restaurant-news-1",
    date: "2025-05-16",
    expectedClass: "irrelevant"
  },
  {
    title: "Property Market Analysis Shows Strong Returns for Multi-Family Investments",
    content: "A comprehensive analysis of the property market reveals that multi-family residential investments are delivering strong returns for investors. Rental demand continues to increase in urban areas, driven by demographic shifts and employment growth. Investment strategies focusing on affordable housing and mid-market rental properties are showing particular promise. Real estate investment trusts (REITs) specializing in residential properties have outperformed broader market indices this quarter.",
    url: "https://example.com/property-analysis-1",
    date: "2025-05-16",
    expectedClass: "relevant"
  },
  {
    title: "Local Sports Team Wins Championship Title",
    content: "The hometown basketball team secured a decisive victory in the championship finals, bringing home their first title in over a decade. Thousands of fans gathered downtown to celebrate the historic win. Team management credits the success to strong coaching, player development, and community support throughout the season. The victory parade is scheduled for next weekend.",
    url: "https://example.com/sports-news-1",
    date: "2025-05-16",
    expectedClass: "irrelevant"
  },
  {
    title: "Commercial Real Estate Trends: Office Buildings vs. Warehouse Spaces",
    content: "The commercial real estate sector is experiencing significant changes as investor preferences shift between traditional office buildings and modern warehouse facilities. E-commerce growth has driven increased demand for logistics and distribution centers, while remote work trends have impacted office space utilization. Investment analysts recommend diversified portfolios that include both property types to balance risk and returns. Industrial real estate continues to show strong performance metrics.",
    url: "https://example.com/commercial-real-estate-1",
    date: "2025-05-16",
    expectedClass: "relevant"
  },
  {
    title: "Technology Company Announces New Software Release",
    content: "A leading technology company unveiled its latest software platform designed to improve business productivity and collaboration. The new features include advanced analytics, cloud integration, and enhanced security protocols. Beta testing results show significant improvements in user efficiency and system performance. The software will be available for enterprise customers starting next month.",
    url: "https://example.com/tech-news-1",
    date: "2025-05-16",
    expectedClass: "irrelevant"
  },
  {
    title: "Real Estate Investment Trusts Report Strong Q1 Performance",
    content: "Several major Real Estate Investment Trusts (REITs) reported better-than-expected earnings for the first quarter, driven by strong rental income and property appreciation. Dividend yields remain attractive for income-focused investors, while portfolio diversification across residential, commercial, and industrial properties has helped mitigate market volatility. Industry experts suggest REITs continue to offer compelling opportunities for both institutional and individual investors seeking real estate exposure.",
    url: "https://example.com/reit-performance-1",
    date: "2025-05-16",
    expectedClass: "relevant"
  },
  {
    title: "Fashion Week Showcases Latest Designer Collections",
    content: "International Fashion Week concluded with stunning displays of creativity from renowned designers around the world. This season's collections emphasize sustainable materials and innovative design techniques. Industry influencers and celebrities attended the exclusive runway shows, generating significant social media engagement. Fashion retailers are already placing orders for the upcoming season based on the positive reception.",
    url: "https://example.com/fashion-news-1",
    date: "2025-05-16",
    expectedClass: "irrelevant"
  }
];

// Save test articles
for (let i = 0; i < testArticles.length; i++) {
  const article = testArticles[i];
  const fileName = `test-article-${i + 1}.json`;
  
  // Remove the expectedClass field before saving (this is just for our reference)
  const { expectedClass, ...articleData } = article;
  
  await fs.writeFile(
    path.join('data/test', fileName),
    JSON.stringify(articleData, null, 2)
  );
  
  console.log(`Created ${fileName} (expected: ${expectedClass})`);
}

console.log(`\n✅ Created ${testArticles.length} test articles in data/test/`);
console.log('\nExpected classifications:');
testArticles.forEach((article, index) => {
  console.log(`  ${index + 1}. ${article.title.substring(0, 50)}... -> ${article.expectedClass}`);
});

console.log('\n🧪 You can now test your model with these articles!');
console.log('   Run: node src/tools/model-trainer.mjs');
console.log('   Select option 4, then enter: ./data/test');