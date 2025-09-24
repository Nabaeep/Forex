// api/index.js
const express = require("express");
const serverless = require("serverless-http");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const app = express();

app.get("/forex-events", async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.goto("https://www.forexfactory.com/calendar", { waitUntil: "networkidle2" });

    const $ = cheerio.load(await page.content());
    const events = [];

    $(".calendar__row").each((i, row) => {
      const date = $(row).find(".calendar__date span").first().text().trim();
      const time = $(row).find(".calendar__time").first().text().trim();
      const title = $(row).find(".calendar__event-title").text().trim();
      if (title) events.push({ date, time, title });
    });

    await browser.close();
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Forex events" });
  }
});

module.exports = serverless(app);
