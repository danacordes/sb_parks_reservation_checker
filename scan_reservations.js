const https = require('https')
const fs = require('fs');
const url = require('url');
const { count, Console } = require('console');
const { resolve } = require('path/posix');
//const URL = require('url').URL;

const desiredPadTypes =  ['Hookup - Full','Hookup - Partial'];

const allParams = [
  {
    name:'Cachuma',
    url:'https://reservations.sbparks.org/reservation/getresults.asp',
    detailURL:'https://reservations.sbparks.org/reservations/siteDetails.asp',
    detailURLParams:'?arrive_date=7%2F16%2F2021&depart_date=7%2F18%2F2021&reserve_type=camping&item_idno=2552',
    parent_idno:'1',
    selected_idno:'1',
    arrive_date:'7/18/2021',
    depart_date:'7/20/2021',
    cust_type_idno:'0',
    isBuilder:'0',
    typeUrl:'camping',
    showsites:''
  },
  {
    name:'Jalama',
    url:'https://reservations.sbparks.org/reservation/getresults.asp',
    detailURL:'https://reservations.sbparks.org/reservations/siteDetails.asp',
    parent_idno:'2',
    selected_idno:'2',
    arrive_date:'7/18/2021',
    depart_date:'7/20/2021',
    cust_type_idno:'0',
    isBuilder:'0',
    typeUrl:'camping',
    showsites:''
  },
   {
    name:'Casitas - Angler',
    url:'https://reservations.casitaswater.org//reservation/getresults.asp',
    detailURL:'https://reservations.sbparks.org/reservations/siteDetails.asp',
    parent_idno:'1',
    selected_idno:'1',
    arrive_date:'7/18/2021',
    depart_date:'7/20/2021',
    cust_type_idno:'0',
    isBuilder:'0',
    typeUrl:'camping',
    showsites:''
  },
  {
    name:'Casitas - Bass',
    url:'https://reservations.casitaswater.org//reservation/getresults.asp',
    detailURL:'https://reservations.sbparks.org/reservations/siteDetails.asp',
    parent_idno:'3',
    selected_idno:'3',
    arrive_date:'7/18/2021',
    depart_date:'7/20/2021',
    cust_type_idno:'0',
    isBuilder:'0',
    typeUrl:'camping',
    showsites:''
  },
  {
    name:'Casitas - Egret',
    url:'https://reservations.casitaswater.org//reservation/getresults.asp',
    detailURL:'https://reservations.sbparks.org/reservations/siteDetails.asp',
    parent_idno:'6',
    selected_idno:'6',
    arrive_date:'7/18/2021',
    depart_date:'7/20/2021',
    cust_type_idno:'0',
    isBuilder:'0',
    typeUrl:'camping',
    showsites:''
  },
  {
    name:'Casitas - Fox',
    url:'https://reservations.casitaswater.org//reservation/getresults.asp',
    detailURL:'https://reservations.sbparks.org/reservations/siteDetails.asp',
    parent_idno:'7',
    selected_idno:'7',
    arrive_date:'7/18/2021',
    depart_date:'7/20/2021',
    cust_type_idno:'0',
    isBuilder:'0',
    typeUrl:'camping',
    showsites:''
  },
  {
    name:'Casitas - Indian',
    url:'https://reservations.casitaswater.org//reservation/getresults.asp',
    detailURL:'https://reservations.sbparks.org/reservations/siteDetails.asp',
    parent_idno:'10',
    selected_idno:'10',
    arrive_date:'7/18/2021',
    depart_date:'7/20/2021',
    cust_type_idno:'0',
    isBuilder:'0',
    typeUrl:'camping',
    showsites:''
  }
];

function setDates(allParams, arriveDate, departDate){
  for (const paramIndex in allParams) {
    allParams[paramIndex].arrive_date = arriveDate;
    allParams[paramIndex].depart_date = departDate;
  }
  //console.log(JSON.stringify(allParams,null,4));
}

function getSiteInfo(campgroundParams) {
  const requestURL = buildURL(campgroundParams.url, campgroundParams);

	return new Promise((resolve, reject) => {
		https.get(requestURL, (response) => {
			let chunks_of_data = [];

			response.on('data', (fragments) => {
				chunks_of_data.push(fragments);
			});

			response.on('end', () => {
				let body = Buffer.concat(chunks_of_data);
        
        const possibleSites = processPayload(body);
        let result = [];
        result.push(campgroundParams.name);
        result.push(`Total possible sites: ${possibleSites.length}`);
        result.push(getReservationLinks(campgroundParams, possibleSites));

        resolve(result.join("\n"));

			});

			response.on('error', (error) => {
				reject(error);
			});
		});
	});

}

function getReservationLinks(campgroundParams, possibleSites){

  let result = '';

  for (const siteIndex in possibleSites) {
    let site = possibleSites[siteIndex];
    let output = [];
    output.push('Site #' + site.name);
//    output.push('walkuponly: ' + site.walkuponly);
//    output.push('reservable: ' + site.reservable);
//    output.push('site_type_idno: ' + site.site_type_idno);
    output.push(getDetailURL(campgroundParams, site));
    result += output.join(' - ') + "\n";
    //result += 'Site #' + site.name + ' - ' + getDetailURL(campgroundParams, site) + "\n";

  }

  return result;
}

function getDetailURL(campgroundParams, site){
  let detailURL = new URL(campgroundParams.detailURL);

  detailURL.searchParams.append('arrive_date', campgroundParams.arrive_date);
  detailURL.searchParams.append('depart_date', campgroundParams.depart_date);
  detailURL.searchParams.append('reserve_type', campgroundParams.typeUrl);
  detailURL.searchParams.append('item_idno', site.idno);
  //detailURLParams:'?arrive_date=7%2F16%2F2021&depart_date=7%2F18%2F2021&reserve_type=camping&item_idno=2552',
  
  return detailURL;
}

function processPayload(payload){
    const responseData = JSON.parse(payload);
    fs.writeFileSync('out.json', JSON.stringify(responseData, null, 4));

    const padTypes = [];
    const padsArray = responseData.jsonPadicons;
    for (const padIndex in padsArray) {
      padTypes[padsArray[padIndex].type_name] = 1; 
      //console.log(JSON.stringify(pad));
    }
    //process.stdout.write(Object.keys(padTypes).join("\n"));
    const availablePads = filterPads(responseData.jsonPadicons, desiredPadTypes);
    //process.stdout.write(JSON.stringify(availablePads, null, 4));
    return availablePads;
}

function filterPads(padArray, typeArray){
  return padArray.filter(pad => 
    typeArray.includes(pad.type_name) && 
    pad.reservable == 1 &&
    pad.walkuponly != 'Y' &&
    pad.disable_access == ''
    );
}

function buildURL(baseURL, params){
  let returnURL = new URL(baseURL);
  for (const param in params) {
//    console.log(`${param}: ${params[param]}`);
    returnURL.searchParams.append(param, params[param]);
  }
  return returnURL;
}
function getNextStartEndDates(pointDate){
  //console.log(JSON.stringify(pointDate));  

  let nextFriday = new Date(pointDate);
  nextFriday.setDate(nextFriday.getDate() + (5 - pointDate.getDay()));

  let followingSunday = new Date(nextFriday);
  followingSunday.setDate(nextFriday.getDate() + 2);

  return [nextFriday.toLocaleDateString("en-US"), followingSunday.toLocaleDateString("en-US")];
}

function getStartEndDates(beginningDate, numberOfWeeks){
  let iteratorDate = new Date(beginningDate);
  let result = [];
  for(let i = 0; i < numberOfWeeks; i++){
    result.push(getNextStartEndDates(iteratorDate));
    iteratorDate.setDate(iteratorDate.getDate() + 7);
  }

  return result;
}

async function execute(){

  const weekendDates = getStartEndDates(new Date(), 8);
  //console.log(JSON.stringify(weekendDates, null, 4));

  for( weekendIndex in weekendDates){
    let thisWeekend = weekendDates[weekendIndex]; 

    console.log(`Weekend of *${thisWeekend[0]}-${thisWeekend[1]}*`)
    setDates(allParams, thisWeekend[0], thisWeekend[1]);
    //let siteResponse = querySites(allParams);


    for (const paramIndex in allParams) {
      let campgroundParams = allParams[paramIndex];

      //getSiteInfo(campgroundParams);
      let siteResponse = getSiteInfo(campgroundParams);
      let reponseOutput = await siteResponse;
      console.log(reponseOutput);

    }

  }

}

execute();