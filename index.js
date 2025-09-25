const express = require("express");
const puppeteer = require("puppeteer"); // full Chromium bundled
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", async (req, res) => {
  let browser;
  try {
    // Launch headless Chromium (works on Linux in Render)
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
    );

    // Go to Forex Factory calendar
    await page.goto("https://www.forexfactory.com/calendar", { waitUntil: "networkidle2" });

    // Get rendered HTML
    const html = await page.content();
    const $ = cheerio.load(html);

    const events = [];
    let lastDate = "", lastTime = "", lastImpact = "";

    $(".calendar__row").each((i, row) => {
      let date = $(row).find(".calendar__date span").first().text().trim();
      let time = $(row).find(".calendar__time").first().text().trim();
      let title = $(row).find(".calendar__event-title").text().trim();

      // Determine impact
      let impact = "";
      const spanImpact = $(row).find(".calendar__impact span[title]");
      if (spanImpact.length) {
        impact = spanImpact.attr("title").split(" ")[0];
      } else {
        const imgImpact = $(row).find(".calendar__impact-icon img").attr("src") || "";
        if (imgImpact.includes("ff-impact-red")) impact = "High";
        else if (imgImpact.includes("ff-impact-ora") || imgImpact.includes("ff-impact-ylw")) impact = "Medium";
        else if (imgImpact.includes("ff-impact-gry")) impact = "Low";
      }

      // Maintain last seen values
      if (date) lastDate = date; else date = lastDate;
      if (time) lastTime = time; else time = lastTime;
      if (impact) lastImpact = impact; else impact = lastImpact;

      if (title) events.push({ date, time, title, impact });
    });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Forex events" });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
