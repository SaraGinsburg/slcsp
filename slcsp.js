//==============================================================================
// allow data parsing and conversion between json and csv
const fs = require('fs');
const csvToJson = require('csvtojson');
const jsonToCsv = require('json2csv').parse;


//Lodash - JS library, to allow more concise and maintainable JS
const _ = require('lodash');

// files and their respective paths
const zipsCsv = 'zips.csv';
const slcspCsv = 'slcsp.csv';
const plansCsv = 'plans.csv';


//JSON files
let zipsJson, slcspJson, plansJson;

//==============================================================================
healthPlan = {}


healthPlan.slcsp = () => {
  csvToJson().fromFile(zipsCsv).then((result) => {
    zipsJson = result;
    csvToJson().fromFile(plansCsv).then((result) => {
      plansJson = result;
      csvToJson().fromFile(slcspCsv).then((result) => {
        slcspJson = result;
        let outputJson = healthPlan.zip(slcspJson)
        let outputCsv = jsonToCsv(outputJson, {quote: ''});
        console.log("outputJson", outputJson)
        console.log("outputCsv testing!!!!", outputCsv)
      })
    })
  })
}


//for each zipcode, find all records in the zips file matching the selected zip.
// place the matching rate_area in an array, remove duplicate records
//check for ambiguity, should not have more than one rate_area per zip
healthPlan.zip = (slcspJson) => {
  _.each(slcspJson, function(rec) {
    let zipRates = _.filter(zipsJson, {zipcode: rec.zipcode});
    if (zipRates.length > 0){
      let state, ratesAreaArr = [];
      _.each(zipRates, function (zr) {
        ratesAreaArr.push(zr.rate_area)
        state = zr.state
      })
      ratesAreaArr = _.uniq(ratesAreaArr)
      if (ratesAreaArr.length === 1) {
        rec.rate = healthPlan.plan(ratesAreaArr[0], state)
      } else {
        rec.rate = '';
      }
    }
  })
  return slcspJson;
}


// ra (rate_area), st (state)
healthPlan.plan = (ra,st) => {
  let plans = _.filter(plansJson, {state: st, rate_area: ra, metal_level:"Silver"})  //
  return healthPlan.calculateSlcsp(plans);
}


//Zip codes for which less than two silver plans are discovered, are to be
//given No SLCSP value in the resulting file
healthPlan.calculateSlcsp = (selectedPlans) => {
  plans = _.sortBy(selectedPlans, 'rate')
  if (plans.length < 2) {
    return '';
  } else {
      let i = 0;
      while(i < plans.length){
        if (plans[i].rate < plans[i+1].rate){
          return Number(plans[i+1].rate).toFixed(2)
        } else {
          i = i + 1
        }
      }
      return '';
  }
}


// expose the healthPlan object as a module
module.exports = healthPlan;


//run this application
healthPlan.slcsp();
