const express = require("express");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", async (req, res) => {
  try {
    const response = await fetch("https://www.forexfactory.com/calendar");
    const html = await response.text();
    const $ = cheerio.load(html);

    const events = [];
    let lastDate = "", lastTime = "", lastImpact = "";

    $(".calendar__row").each((i, row) => {
      let date = $(row).find(".calendar__date span").first().text().trim();
      let time = $(row).find(".calendar__time").first().text().trim();
      let title = $(row).find(".calendar__event-title").text().trim();
      let impact = $(row).find(".calendar__impact span").attr("title") || "";




      if (date) lastDate = date; else date = lastDate;
      if (time) lastTime = time; else time = lastTime;
      if (impact) lastImpact = impact; else impact = lastImpact;

      if (title) events.push({ date, time, title, impact });
    });

    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch Forex events" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
