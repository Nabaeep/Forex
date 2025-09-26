const express = require("express");
const { chromium } = require("playwright"); // Use Playwright's Chromium
const cheerio = require("cheerio");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

// --- Caching Logic for speed and reliability ---
let cache = {
    data: null,
    timestamp: 0,
};
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// This helper function is no longer needed as Playwright's goto is more robust.

app.get("/", async (req, res) => {
    // --- Serve from cache if data is fresh ---
    if (cache.data && (Date.now() - cache.timestamp < CACHE_DURATION)) {
        console.log("Serving response from cache...");
        return res.json(cache.data);
    }
    
    console.log("Cache is old or empty. Scraping new data with Playwright/Chromium...");
    let browser = null;
        browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined
});

    try {
        // --- Launch Playwright's Chromium browser ---
   


        const context = await browser.newContext({
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
            viewport: { width: 1280, height: 800 },
        });

        const page = await context.newPage();
        
        // --- Navigate to the calendar page ---
        await page.goto("https://www.forexfactory.com/calendar", { 
            waitUntil: 'domcontentloaded', 
            timeout: 60000 // 60-second timeout for navigation
        });

        const html = await page.content();
        const $ = cheerio.load(html);

        const events = [];
        let lastDate = "", lastTime = "";

        $(".calendar__row").each((i, row) => {
            let date = $(row).find(".calendar__date span").first().text().trim();
            let time = $(row).find(".calendar__time").first().text().trim();
            let currency = $(row).find(".calendar__currency").text().trim();
            let title = $(row).find(".calendar__event-title").text().trim();

            // --- THIS IS THE CORRECTED, MORE RELIABLE IMPACT SCRAPER ---
            let impact = "N/A";
            const impactSpan = $(row).find(".calendar__impact span").first();
            const impactClass = impactSpan.attr('class') || "";

            if (impactClass.includes('icon--ff-impact-red')) impact = "High";
            else if (impactClass.includes('icon--ff-impact-ora')) impact = "Medium";
            else if (impactClass.includes('icon--ff-impact-ylw')) impact = "Low";
            else if (impactClass.includes('icon--ff-impact-gry')) impact = "Holiday";
            // --- End of corrected scraper ---

            if (date) lastDate = date; else date = lastDate;
            if (time) lastTime = time; else time = lastTime;
            
            // Note: We no longer need to carry over 'lastImpact' as the new scraper finds it on every relevant row.

            if (title) {
                events.push({ date, time, currency, title, impact });
            }
        });
        
        // --- Save the newly scraped data to the cache ---
        cache = { data: events, timestamp: Date.now() };
        res.json(events);

    } catch (err) {
        console.error("An error occurred during scraping:", err);
        res.status(500).json({ error: err.message || "An unexpected error occurred." });
    } finally {
        if (browser) {
            await browser.close();
            console.log("Browser closed.");
        }
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
