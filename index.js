const { chromium } = require('playwright');
const express = require('express');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/', async (req, res) => {
  try {
    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create context with user agent
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
    });

    const page = await context.newPage();
    await page.goto("https://www.forexfactory.com/calendar", { waitUntil: 'networkidle' });

    const content = await page.content();
    const $ = cheerio.load(content);

    const events = [];
    let lastDate = "";
    let lastTime = "";
    let lastImpact = "";

    $(".calendar__row").each((i, row) => {
      let date = $(row).find(".calendar__date span").first().text().trim();
      let time = $(row).find(".calendar__time").first().text().trim();
      let title = $(row).find(".calendar__event-title").text().trim();
      let impact = $(row).find(".calendar__impact .icon").attr("title") || "";

      if (date) lastDate = date; else date = lastDate;
      if (time) lastTime = time; else time = lastTime;
      if (impact) lastImpact = impact; else impact = lastImpact;

      if (title) {
        events.push({ date, time, title, impact });
      }
    });

    await browser.close();
    res.json(events);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Forex events" });
  }
});

// Use dynamic port for hosting
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
