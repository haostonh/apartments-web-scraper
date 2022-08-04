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
  const cityFormatted = cityStateInfo[0].replace('/\x20/g', '-').toLowerCase();
  const stateFromatted = cityStateInfo[1].toLowerCase();
  const url = 'https://www.apartments.com/' + cityFormatted + "-" + stateFromatted;

  return url;
} 

async function getNumberPageResults(url) {
  let numberPageResults;

  // Send a GET request for number of result pages
  await axios(url)
    .then(response => {
      const html = response.data;
      const $ = cheerio.load(html);

      const pageRangeText = $('.pageRange',html).text();
      const regex = /Page\x20[0-9]+\x20of\x20/;
      numberPageResults = (pageRangeText.replace(regex,''));
    })
    .catch(err => 
      console.log('Error Status:', err.response.status)
      );

  return numberPageResults;
}

async function getApartmentPageResults(url) {
  // Sending a GET request for apartment info from one page of the website
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
    })
    .catch(err => 
      console.log('Error Status:', err.response.status)
      );
}

function putInfoIntoCSV(apartments) {
  const fields = ['aptName', 'aptAddress', 'aptPhoneNumber', 'aptPricing', 'aptBeds', 'aptLink'];
  const options = { fields };
  
  try {
    let csv = parse(apartments, options);

    // Add header to csv if it is a new file
    if (fs.existsSync('./apartments.csv')) {
      csv = csv.replace("\"aptName\",\"aptAddress\",\"aptPhoneNumber\",\"aptPricing\",\"aptBeds\",\"aptLink\"",'');
    }

    var aptFile = fs.openSync('./apartments.csv', 'a+');
    fs.readFileSync('./apartments.csv');
    fs.writeFileSync(aptFile, csv, {flag: 'a+'});
    fs.closeSync(aptFile);
  } catch (err) {
    console.log(err);
  }
}

async function getApartmentInfo(url, cityStateInfo) {
  // Open the port to listen for url
  const server = webScraper.listen(PORT, () => console.log(`\nListening on PORT ${PORT} \n`));

  let numberPageResults = await getNumberPageResults(url);
  let currentPageNumber = 1;
  let urlWithPageNumber;
  
  let pagesFirstorAll = readlineSync.question('Do you want all pages of results?\n\'Y\' for all pages / \'N\' for first page: ', {
    limit: /[nNyY]/, 
    limitMessage: 'Enter \'Y\' or \'N\''
  });

  if (pagesFirstorAll == 'n' || pagesFirstorAll == 'N') {
    numberPageResults = 1;
  }

  console.log("\nThis may take a few minutes\n");

  while(currentPageNumber <= numberPageResults) {
    if (currentPageNumber == 1) {
      await getApartmentPageResults(url);
      currentPageNumber++;
      continue;
    }

    urlWithPageNumber = url + '/' + currentPageNumber + '/';
    await getApartmentPageResults(urlWithPageNumber);
    currentPageNumber++;
  }

  console.log("Apartments near/in " + cityStateInfo[0] + ", " + cityStateInfo[1] + " logged into CSV successfully");

  // Close the port 
  server.close();
}

const cityStateInfo = getCityState();
const url = getURL(cityStateInfo);
getApartmentInfo(url, cityStateInfo);