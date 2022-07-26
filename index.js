const PORT = "8080"

const axios = require("axios")
const cheerio = require("cheerio")
const express = require("express")
const prompt = require("prompt")

const webScraper = express()

var url = "https://www.apartments.com/davis-ca/"

function getURL() {
  const properties = [
  {
    name: 'city',
    validator: '/^[a-zA-Z]+(\x20([a-zA-Z]+))*$/',
    warning: 'City names greater than one word must be separated by a space'
  },
  {
    name: 'state',
    validator: '/^[A-Z]{2}$/',
    warning: 'State must be abbreviated to 2 letters. Example: CA (California)'
  }]

  let city = ""
  let state = ""

  prompt.get(properties, function (err, result) {
    //
    // Log the results.
    //
    console.log('Command-line input received:')
    console.log('  username: ' + result.city)
    console.log('  email: ' + result.state)

    city = result.city
    state = result.state
  })
}

function getApartmentInfo() {
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
        const aptPricing = $('.property-pricing', this).text()
        const aptBeds = $('.property-beds', this).text()
        const aptLink = $('.property-information', this).find('a').attr('href')

        apartments.push({
          aptName,
          aptAddress,
          aptPhoneNumber,
          aptPricing,
          aptBeds,
          aptLink
        })
      })

      console.log(apartments)
    }).catch(err => 
      console.log("Error Status:", err.response.status)
      )
}

webScraper.listen(PORT, () => console.log(`Listening on PORT ${PORT}`))

getURL();
getApartmentInfo();