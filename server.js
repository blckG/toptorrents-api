"use strict";

const express = require("express");

const settings = require("./settings");
const tasks = require("./tasks");

let DEFAULT_PORT = 3000;
let TORRENT_DATA;

let app = express();

/**
 * Return a list of available torrent categories.
 */
app.get("/", (req, res) => {
  if (!TORRENT_DATA) {
    return res.status(503).json({ error: "Currently rebuilding the torrent index. Please try again in a moment!" });
  }

  res.json({ categories: Object.keys(TORRENT_DATA) });
});

/**
 * Return the top 100 torrents for the specified category.
 */
app.get("/:categoryName", (req, res, next) => {
  let categoryName = req.params.categoryName;

  if (!TORRENT_DATA[categoryName]) {
    return res.status(400).json({ error: "Invalid categoryName specified. Please try again. Full list of valid categories available at / endpoint." });
  }

  res.json({ torrents: TORRENT_DATA[categoryName] });
});

/**
 * Handle 404s.
 */
app.use((req, res, next) => {
  res.status(404).json({
    error: "API endpoint does not exist."
  })
});

/**
 * Handle errors.
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something bad happened! If this problem persists, please email me: " + settings.ADMIN_EMAIL });
});

/**
 * When the server first starts up, we'll do our scraping and build the index.
 */
console.log("Updating torrent index.");
tasks.scrape((err, data) => {
  if (err) {
    console.error(err);
  } else {
    TORRENT_DATA = data;
  }
});

/**
 * Re-build the torrent index every so often.
 */
setInterval(() => {
  console.log("Updating torrent index.");
  tasks.scrape((err, data) => {
    if (err) {
      console.error(err);
    } else {
      TORRENT_DATA = data;
    }
  });
}, settings.INDEX_UPDATE_INTERVAL);

app.listen(process.env.PORT || DEFAULT_PORT);
