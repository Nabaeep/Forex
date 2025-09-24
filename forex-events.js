const express = require("express");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/forex-events", async (req, res) => {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
    );

    await page.goto("https://www.forexfactory.com/calendar", { waitUntil: "networkidle2" });

    const content = await page.content();
    const $ = cheerio.load(content);

    const events = [];

    $(".calendar__row").each((i, row) => {
      const date = $(row).find(".calendar__date span").first().text().trim();
      const time = $(row).find(".calendar__time").first().text().trim();
      const title = $(row).find(".calendar__event-title").text().trim();

      if (title) {
        events.push({ date, time, title });
      }
    });

    await browser.close();
    res.json(events);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Forex events" });
  }
});

app.listen(3000, () => console.log("API running on http://localhost:3000"));
