const PORT = '8080';

const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const fs = require('fs');
const {parse} = require('json2csv');
const promise = require('promise');
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
  const cityFormatted = cityStateInfo[0].replace('/\x20/g', '-').toLowerCase();
  const stateFromatted = cityStateInfo[1].toLowerCase();
  const url = 'https://www.apartments.com/' + cityFormatted + "-" + stateFromatted;

  return url;
} 

async function getNumberPageResults(url) {
  let numPageResults;

  // Send a GET request for number of result pages
  await axios(url)
    .then(response => {
      const html = response.data;
      const $ = cheerio.load(html);

      const pageRangeText = $('.pageRange',html).text();
      const regex = /Page\x20[0-9]+\x20of\x20/;
      numPageResults = (pageRangeText.replace(regex,''));

      console.log(typeof numPageResults);
      return numPageResults;
    })
    .catch(err => 
      console.log('Error Status:', err.response.status)
      );

  return numPageResults;
}

function getApartmentPageResults(url) {
  // Sending a GET request for apartment info from one page of the website
  axios(url)
    .then(response => {
      const apartments = [];

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

      putInfoIntoCSV(apartments);
      console.log("Apartments logged into CSV successfully");
    })
    .catch(err => 
      console.log('Error Status:', err.response.status)
      );
}

async function getApartmentInfo(url) {
  // Open the port to listen for url
  const server = webScraper.listen(PORT, () => console.log(`Listening on PORT ${PORT}`));

  let numPageResults = await getNumberPageResults(url);
  // Send a GET request for number of result pages
  /*await axios(url)
    .then(response => {
      const html = response.data;
      const $ = cheerio.load(html);

      const pageRangeText = $('.pageRange',html).text();
      const regex = /Page\x20[0-9]+\x20of\x20/;
      numPageResults = Number(pageRangeText.replace(regex,''));

      console.log(typeof numPageResults);
    })
    .catch(err => 
      console.log('Error Status:', err.response)
      );

  console.log(numPageResults)*/
  
  await axios(url)
    .then(response => {
      const apartments = [];

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

      putInfoIntoCSV(apartments);
      console.log("Apartments logged into CSV successfully");
    })
    .catch(err => 
      console.log('Error Status:', err.response.status)
      );


  for (let i = 2; i <= numPageResults; i++) {
    let urlWithPageNumber = url + '/' + i + '/';

    await axios(urlWithPageNumber)
    .then(response => {
      const apartments = [];

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

      putInfoIntoCSV(apartments);
      console.log("Apartments logged into CSV successfully");
    })
    .catch(err => 
      console.log('Error Status:', err.response.status)
      );
  }
  // Close the port 
  server.close();
  
}

async function test1(url, numberPageResults) {
  let currentPageNumber = 1;
  let urlWithPageNumber;

  console.log("Num Page Results: ", numberPageResults)
  console.log(currentPageNumber)

  while(currentPageNumber <= numberPageResults) {
    if(currentPageNumber == 1) {
      getApartmentPageResults(url);
      currentPageNumber++;
      continue;
    }

    urlWithPageNumber = url + '/' + currentPageNumber + '/';
    getApartmentPageResults(urlWithPageNumber);
    currentPageNumber++;
  }
}

function putInfoIntoCSV(apartments) {
  const fields = ['aptName', 'aptAddress', 'aptPhoneNumber', 'aptPricing', 'aptBeds', 'aptLink'];
  const options = { fields };
  
  try {
    const csv = parse(apartments, options);
    var aptFile = fs.openSync('./apartments.csv', 'a+');
    fs.readFileSync('./apartments.csv');
    fs.writeFileSync(aptFile, csv, {flag: 'a+'});
    fs.closeSync(aptFile);
  } catch (err) {
    console.log(err);
  }
}

const cityStateInfo = getCityState();
const url = getURL(cityStateInfo);
getApartmentInfo(url);