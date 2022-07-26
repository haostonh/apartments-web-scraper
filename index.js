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

    $('.placard', html).each(function() {
      // needs a dash looking at page inspect
      // there were property-title classes in other sections, causing blank strings
      const aptName = $('.property-title', this).text()
      const aptAddress = $('.property-address', this).text()
      const aptPhoneNumber = $('.phone-link', this).find('span').text()

      apartments.push({
        aptName,
        aptAddress,
        aptPhoneNumber
      })
    })

    console.log(apartments)
  })

webScraper.listen(PORT, () => console.log(`Listening on PORT ${PORT}`))