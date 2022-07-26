const PORT = "8080"

const axios = require("axios")
const cheerio = require("cheerio")
const express = require("express")

const webScraper = express()

const url = "https://www.apartments.com/davis-ca/"

// Sending a GET request for the info on website
axios(url)
  .then(response => {
    const html = response.data
    const $ = cheerio.load(html)
    const apartments = []

    $('.property-title', html).each(function() {
      // needs a dash looking at page inspect
      const aptName = $(this).text()

      apartments.push({
        aptName
      })
    })

    console.log(apartments)
  })

webScraper.listen(PORT, () => console.log(`Listening on PORT ${PORT}`))