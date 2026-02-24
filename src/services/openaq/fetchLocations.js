import fetch from "node-fetch";

const LATEST_LOCATION_URL = "https://api.openaq.org/v3/locations";
const LIMIT = 1000;

const REQUESTS_PER_MIN = 30;
const DELAY_MS = Math.ceil(60_000 / REQUESTS_PER_MIN);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchLocations= async () => {
	let allLocations= []; let page = 1;
	while(true){
		const params = new URLSearchParams({
			limit : LIMIT,
			page : page,
		});
		
		const res = await fetch(`${LATEST_LOCATION_URL}?${params}`, {
      headers: {
        "X-API-Key": process.env.OPENAQ_API_KEY
      }
    });
    
  //   if(!res.ok){
	//     const text = await res.text();
  // console.error("API ERROR:", res.status, text);
  // throw new Error(`failed at page: ${page}`);
  //   }
    
    // const data = await res.json()?.results || [] ;
    const json = await res.json();
    console.log("API response count:", json?.results?.length);
    const data = json.results || [];
    
    if(data.length == 0) {
	    break;
    }
    
    allLocations.push(...data);
    
    if(data.length < LIMIT){
	    break;
    }
    page++;
    
    await sleep(DELAY_MS);

	}
	
	return allLocations;
}
