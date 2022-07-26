const PORT = "8080";

const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");

const webScraper = express();

webScraper.listen(PORT, () => console.log(`Listening on PORT ${PORT}`))