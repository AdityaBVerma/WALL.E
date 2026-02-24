import fetch from "node-fetch";

const LATEST_PM25_URL = "https://api.openaq.org/v3/parameters/2/latest";
const LIMIT = 1000;

const REQUESTS_PER_MIN = 30;
const DELAY_MS = Math.ceil(60_000 / REQUESTS_PER_MIN);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchSensors= async () => {
	let allSensors = []; let page = 1;
	while(true){
		const params = new URLSearchParams({
			limit : LIMIT,
			page : page,
		});
		
		const res = await fetch(`${LATEST_PM25_URL}?${params}`, {
      headers: {
        "X-API-Key": process.env.OPENAQ_API_KEY
      }
    });
    
    if(!res.ok){
	    throw new Error(`failed at page: ${page}`);
    }
    
    // const data = await res.json()?.results || [] ;
    const json = await res.json();
    console.log("API response count:", json?.results?.length);
    const data = json.results || [];
    
    if(data.length == 0) {
	    break;
    }
    
    allSensors.push(...data);
    
    if(data.length < LIMIT){
	    break;
    }
    page++;
    
    await sleep(DELAY_MS);

	}
	
	return allSensors;
}
