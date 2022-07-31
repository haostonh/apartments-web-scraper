const PORT = '8080';

const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const fs = require('fs');
const {parse} = require('json2csv');
const readlineSync = require('readline-sync');

const webScraper = express();

function getCityState() {
  let city = readlineSync.question('Enter City: ', {
    limit: /^[a-zA-Z]+(\x20([a-zA-Z]+))*$/, 
    limitMessage: 'For Cities with 2+ Words, Enter a space in between'
  });

  let state = readlineSync.question('Enter State: ', {
    limit: /^[a-zA-Z]{2}$/,
    limitMessage: '2 Letter State Abbreviations Only'
  });

  return [city, state];
}

function getURL(cityStateInfo) {
  const cityFormatted = cityStateInfo[0].replace('/\x20/g','-').toLowerCase();
  const stateFromatted = cityStateInfo[1].toLowerCase();
  const url = 'https://www.apartments.com/' + cityFormatted + "-" + stateFromatted;

  return url;
} 

function getApartmentInfo(url) {
  // Open the port to listen for url
  webScraper.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));

  const apartments = [];

  // Sending a GET request for the info on website
  axios(url)
    .then(response => {
      const html = response.data;
      const $ = cheerio.load(html);

      $('.placard', html).each(function() {
        // Needs a dash looking at page inspect
        // There were property-title classes in other sections, causing blank strings
        const aptName = $('.property-title', this).text();
        const aptAddress = $('.property-address', this).text();
        const aptPhoneNumber = $('.phone-link', this).find('span').text();
        const aptPricing = $('.property-pricing', this).text();
        const aptBeds = $('.property-beds', this).text();
        const aptLink = $('.property-information', this).find('a').attr('href');

        apartments.push({
          aptName,
          aptAddress,
          aptPhoneNumber,
          aptPricing,
          aptBeds,
          aptLink
        });
      });

      console.log(apartments);
      putInfoIntoCSV(apartments);
    })
    .catch(err => 
      console.log('Error Status:', err.response.status)
      );
}

function putInfoIntoCSV(apartments) {
  console.log(apartments)
  const fields = ['aptName', 'aptAddress', 'aptPhoneNumber', 'aptPricing', 'aptBeds', 'aptLink'];
  const options = { fields };
  
  try {
    const csv = parse(apartments,options);
    console.log(csv);
    var aptFile = fs.openSync('./apartments.csv', 'w');
    fs.appendFileSync(aptFile, csv);
    fs.closeSync(aptFile);
  } catch (err) {
    console.log(err);
  }
}

const cityStateInfo = getCityState();
const url = getURL(cityStateInfo);
getApartmentInfo(url);