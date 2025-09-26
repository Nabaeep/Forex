const express = require("express");
const axios = require("axios");
const { parseStringPromise } = require("xml2js");
const cors = require("cors");

const app = express();
app.use(cors());

// --- Cache to reduce load and speed up ---
let cache = { data: null, timestamp: 0 };
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Helper: fetch + parse ForexFactory feed
async function fetchForexFactoryWeek() {
  const url = "https://nfs.faireconomy.media/ff_calendar_thisweek.xml";
  const res = await axios.get(url, { timeout: 15000 });
  const xml = res.data;

  const obj = await parseStringPromise(xml, {
    explicitArray: false,
    trim: true,
  });

  const items = obj?.weeklyevents?.event || [];
  const arr = Array.isArray(items) ? items : [items];

  return arr.map((ev) => ({
    date: ev.date,
    time: ev.time,
    currency: ev.currency,
    title: ev.title,
    impact: ev.impact,
   
  }));
}

// --- API route ---
app.get("/", async (req, res) => {
  try {
    if (cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
      console.log("Serving cached data");
      return res.json(cache.data);
    }

    console.log("Fetching fresh data...");
    const events = await fetchForexFactoryWeek();

    cache = { data: events, timestamp: Date.now() };
    res.json(events);
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: err.message || "Unexpected error" });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
