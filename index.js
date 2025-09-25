const express = require("express");
const puppeteer = require("puppeteer"); // full Chromium bundled
const cheerio = require("cheerio");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

async function safeGoto(page, url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return;
    } catch (err) {
      console.warn(`Navigation attempt ${i+1} failed, retrying...`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Failed to load Forex Factory calendar page.');
}

app.get("/", async (req, res) => {

  const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

  try {
   

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });

    await safeGoto(page, "https://www.forexfactory.com/calendar");

    const html = await page.content();
    const $ = cheerio.load(html);

    const events = [];
    let lastDate = "", lastTime = "", lastImpact = "";

    $(".calendar__row").each((i, row) => {
      let date = $(row).find(".calendar__date span").first().text().trim();
      let time = $(row).find(".calendar__time").first().text().trim();
      let title = $(row).find(".calendar__event-title").text().trim();

      let impact = "";
      const spanImpact = $(row).find(".calendar__impact span[title]");
      if (spanImpact.length) impact = spanImpact.attr("title").split(" ")[0];
      else {
        const imgImpact = $(row).find(".calendar__impact-icon img").attr("src") || "";
        if (imgImpact.includes("ff-impact-red")) impact = "High";
        else if (imgImpact.includes("ff-impact-ora") || imgImpact.includes("ff-impact-ylw")) impact = "Medium";
        else if (imgImpact.includes("ff-impact-gry")) impact = "Low";
      }

      if (date) lastDate = date; else date = lastDate;
      if (time) lastTime = time; else time = lastTime;
      if (impact) lastImpact = impact; else impact = lastImpact;

      if (title) events.push({ date, time, title, impact });
    });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to fetch Forex events" });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
