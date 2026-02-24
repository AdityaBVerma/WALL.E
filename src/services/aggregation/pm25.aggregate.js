import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "..", "..", "data", "pm25.json");

const tempFilePath = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "pm25.tmp.json"
);

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};


export const aggregateData = async (redisClient) => {

	const sensorCount = await redisClient.sCard("openaq:sensors:ids");
// console.log("Redis sensor count after write:", sensorCount);

	const sensorIds = await redisClient.sMembers("openaq:sensors:ids");
	
	const sensorPipeline = redisClient.multi();
	
	sensorIds.forEach( id => {
		sensorPipeline.hGetAll(`openaq:sensor:${id}`);
	})
	
	const sensorResults = await sensorPipeline.exec();
	// console.log("First record from Redis:", JSON.stringify(sensorResults[0], null, 2));
	/*
	as redis when hGetAll returns this way here null is if success [error, result ] common nodejs pattern this was the old version  "corrected hrere" no need for [_,data]
	[
	  [null, { id: "1", value: "15", locationId: "100" }],
	  [null, { id: "2", value: "12", locationId: "100" }],
	  [null, { id: "3", value: "18", locationId: "200" }]
	]
	 */
	const sensors = sensorResults.map((data) => {
		        // console.log("val : " + (data.value));
		        // console.log("id : " + data.id);

		return {
		sensorsId : data.id,
		locationsId : data.locationId,
		datetime : safeParse(data.datetime, {}),
		coordinates : safeParse(data.coordinates, {}),
		value : Number(data.value),
		/*
	    datetime: { utc: '2026-02-03T14:00:00Z', local: '2026-02-03T23:00:00+09:00' },
	    value: 15,
	    coordinates: { latitude: 35.21815, longitude: 128.57425 },
	    sensorsId: 8539597,
	    locationsId: 2622686
		  
      */
	}});
	
	// console.log("sensorIds:", sensorIds.length);
	const locationSet = new Set(sensors.map(sensor => sensor.locationsId));
	
	const locationIds = [
	  ...locationSet
	];
	
	const locationPipeline = redisClient.multi();
	
	locationIds.forEach(id => {
		// console.log(`openaq:location:${id}`);//sahi hai
		locationPipeline.hGetAll(`openaq:location:${id}`);
	})
	
	const locationResult = await locationPipeline.exec();
	/*
	as redis when hGetAll returns this way here null is if success [error, result ] common nodejs pattern **depreceated**
	[
	  [null, { id: "1", value: "15", locationId: "100" }],
	  [null, { id: "2", value: "12", locationId: "100" }],
	  [null, { id: "3", value: "18", locationId: "200" }]
	]
	 */
	const locationMap = {}; 
	
	locationResult.forEach((data) => {
		// console.log(typeof data.country)
		// console.log(data.country)
		// console.log(data.owner)
		// console.log(data.provider)
		// console.log(data.bounds)
		// console.log(data)
		//here is the problem i guess like the parsing
		locationMap[data.id] = {
			name: safeParse(data.name, {}),
			timezone: safeParse(data.timezone, {}),
			country: safeParse(data.country, {}),
			owner: safeParse(data.owner, {}),
			provider: safeParse(data.provider, {}),
			bounds: safeParse(data.bounds, {})
			/*  
				for refrence but pick only necessary
				***** location ****
			  id: 2622686,
			  name: '회원동',
			  locality: ' ',
			  timezone: 'Asia/Seoul',
			  country: { id: 25, code: 'KR', name: 'Republic of Korea' },
			  owner: { id: 4, name: 'Unknown Governmental Organization' },
			  provider: { id: 69, name: 'Korea Air Ministry of Environment' },
			  isMobile: false,
			  isMonitor: true,
			  instruments: [ { id: 2, name: 'Government Monitor' } ],
			  sensors: [
			    { id: 8534096, name: 'co ppm', parameter: [Object] },
			    { id: 8536505, name: 'no2 ppm', parameter: [Object] },
			    { id: 8536332, name: 'o3 ppm', parameter: [Object] },
			    { id: 8534218, name: 'pm10 µg/m³', parameter: [Object] },
			    { id: 8539597, name: 'pm25 µg/m³', parameter: [Object] },
			    { id: 8535138, name: 'so2 ppm', parameter: [Object] }
			  ],
			  coordinates: { latitude: 35.21815, longitude: 128.57425 },
			  licenses: null,
			  bounds: [ 128.57425, 35.21815, 128.57425, 35.21815 ],
			  distance: null,
			  datetimeFirst: { utc: '2024-03-19T23:00:00Z', local: '2024-03-20T08:00:00+09:00' },
			  datetimeLast: { utc: '2026-02-03T14:00:00Z', local: '2026-02-03T23:00:00+09:00' }
		        
		    ***** model *****
		    {
					// from the PM2.5 URI
				  datetime: { utc: '2026-02-03T14:00:00Z', local: '2026-02-03T23:00:00+09:00' },
				  value: 15,
				  coordinates: { latitude: 35.21815, longitude: 128.57425 },
				  sensorsId: 8539597,
				  locationsId: 2622686,
				  // from the location URI
				  name: '회원동',
				  timezone: 'Asia/Seoul',
				  country: { id: 25, code: 'KR', name: 'Republic of Korea' },
				  owner: { id: 4, name: 'Unknown Governmental Organization' },
				  provider: { id: 69, name: 'Korea Air Ministry of Environment' },
				  bounds: [ 128.57425, 35.21815, 128.57425, 35.21815 ],
				}
		    
	      */
		}
		
	});
	// console.log("sensorIds:", sensorIds.length);
	// console.log("locationIds:", locationIds.length);

	const aggregated = sensors.map(sensor => {
	  const location = locationMap[sensor.locationsId];
	//   console.log(sensor)
	//   console.log(location)
	//   console.log("###")
	// 	console.log(location.country)
	  return {
	    datetime: sensor.datetime,
	    value: sensor.value,
	    coordinates: sensor.coordinates,
	    sensorsId: sensor.sensorsId,
	    locationsId: sensor.locationsId,
	    name: location?.name,
	    country: location?.country,
	    timezone: location?.timezone,
	    owner: location?.owner,
	    provider: location?.provider,
	    bounds: location?.bounds
	    /*
	    {
				// from the PM2.5 URI
				datetime: { utc: '2026-02-03T14:00:00Z', local: '2026-02-03T23:00:00+09:00' },
				value: 15,
				coordinates: { latitude: 35.21815, longitude: 128.57425 },
				sensorsId: 8539597,
				locationsId: 2622686,
				// from the location URI
				name: '회원동',
				timezone: 'Asia/Seoul',
				country: { id: 25, code: 'KR', name: 'Republic of Korea' },
				owner: { id: 4, name: 'Unknown Governmental Organization' },
				provider: { id: 69, name: 'Korea Air Ministry of Environment' },
				bounds: [ 128.57425, 35.21815, 128.57425, 35.21815 ],
			}
	    */
	  };
	}).filter(Boolean);

  	fs.writeFileSync(
	  tempFilePath,
	  JSON.stringify(aggregated, null, 2)
	);
	
	/*
	* the temp file gurantees atomicity as the writefilesync is not atomic but rename is 
	*/
	
	/*
	* well sould add metadata collected form aggregate and pushed into aggregate to easily get the lenght and all also for the frontend
	*/
	
	/*
	* check weather the temp is not courupted 
	* 1. the json is not courupted
	*	2. the number of records are not less than certian values
	* 3. aggregated records length is not 0
	* 4. OPTIONAL : check weather each recod contains the required field
	*/
	
	fs.renameSync(tempFilePath, filePath);
	
	console.log(`PM2.5 snapshot written (${aggregated.length} records)`);
	
	// await redisClient.quit();	
		
}