const PORT = "8080"

const axios = require("axios")
const cheerio = require("cheerio")
const express = require("express")
const readlineSync = require("readline-sync")

const webScraper = express()

var url = "https://www.apartments.com/davis-ca/"
var city = ""
var state = ""

function getCityState() {
  city = readlineSync.question('Enter City: ')
  state = readlineSync.question('Enter State: ')
}

function getURL() {
  city = city.replace('/\x20/g','-').toLowerCase()
  state = state.toLowerCase()
  url = "https://www.apartments.com/" + city + "-" + state
} 

function getApartmentInfo() {
  // Open the port to listen for url
  webScraper.listen(PORT, () => console.log(`Listening on PORT ${PORT}`))

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

getCityState()
getURL()
getApartmentInfo()