const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const url = "https://www.forexfactory.com/news";

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
  );

  await page.goto(url, { waitUntil: "networkidle2" });

  // Get page HTML
  const content = await page.content();

  // Load into cheerio
  const $ = cheerio.load(content);

  // Collect all news headlines
  const headlines = [];
  $('a[href^="/news/"]').each((i, el) => {
    headlines.push($(el).text().trim());
  });

  // Print in one line
  console.log("Headlines:", headlines.join(" | "));

  await browser.close();
})();
