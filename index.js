const PORT = "8080";

const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");

const webScraper = express();

const url = "https://www.apartments.com/davis-ca/";

// Sending a GET request for the info on website
axios(url)

webScraper.listen(PORT, () => console.log(`Listening on PORT ${PORT}`))