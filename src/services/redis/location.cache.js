
export const setLocationsRedis = async (redis, locations) => {
	const pipeline = redis.multi();
	
	for(const location of locations){
		if (!location?.id) continue;
		const locationId= location.id.toString();
		
		pipeline.sAdd("openaq:locations:ids", locationId);
		const key = `openaq:location:${locationId}`;
		//the below comment assumed different workarround which lateer was found incorrect as the hset was not taking the arguments assumed in stackoverflow and docs
		//the below was too big Object to handle 
	// 	pipeline.hSet(
	// 		`openaq:location:${locationId}`,
	// 		{
    //    id: locationId,
	
	//     name: location.name ?? "",
	//     locality: location.locality ?? "",
	//     timezone: location.timezone ?? "",
	
	//     country: JSON.stringify(location.country ?? {}),
	//     owner: JSON.stringify(location.owner ?? {}),
	//     provider: JSON.stringify(location.provider ?? {}),
	
	//     isMobile: location.isMobile?.toString() ?? "false",
	//     isMonitor: location.isMonitor?.toString() ?? "false",
	
	//     instruments: JSON.stringify(location.instruments ?? []),
	//     sensors: JSON.stringify(location.sensors ?? []),
	
	//     coordinates: JSON.stringify(location.coordinates ?? {}),
	//     bounds: JSON.stringify(location.bounds ?? []),
	
	//     licenses: JSON.stringify(location.licenses ?? null),
	//     distance:
	// 		location.distance !== null &&
	// 		location.distance !== undefined
	// 		? String(location.distance)
	// 		: "",
	
	//     datetimeFirst: JSON.stringify(location.datetimeFirst ?? {}),
	//     datetimeLast: JSON.stringify(location.datetimeLast ?? {}),
	
	//     updatedAt: new Date().toISOString(),
        
    //     /* 
        
	// 	  id: 2622686,
	// 	  name: '회원동',
	// 	  locality: ' ',
	// 	  timezone: 'Asia/Seoul',
	// 	  country: { id: 25, code: 'KR', name: 'Republic of Korea' },
	// 	  owner: { id: 4, name: 'Unknown Governmental Organization' },
	// 	  provider: { id: 69, name: 'Korea Air Ministry of Environment' },
	// 	  isMobile: false,
	// 	  isMonitor: true,
	// 	  instruments: [ { id: 2, name: 'Government Monitor' } ],
	// 	  sensors: [
	// 	    { id: 8534096, name: 'co ppm', parameter: [Object] },
	// 	    { id: 8536505, name: 'no2 ppm', parameter: [Object] },
	// 	    { id: 8536332, name: 'o3 ppm', parameter: [Object] },
	// 	    { id: 8534218, name: 'pm10 µg/m³', parameter: [Object] },
	// 	    { id: 8539597, name: 'pm25 µg/m³', parameter: [Object] },
	// 	    { id: 8535138, name: 'so2 ppm', parameter: [Object] }
	// 	  ],
	// 	  coordinates: { latitude: 35.21815, longitude: 128.57425 },
	// 	  licenses: null,
	// 	  bounds: [ 128.57425, 35.21815, 128.57425, 35.21815 ],
	// 	  distance: null,
	// 	  datetimeFirst: { utc: '2024-03-19T23:00:00Z', local: '2024-03-20T08:00:00+09:00' },
	// 	  datetimeLast: { utc: '2026-02-03T14:00:00Z', local: '2026-02-03T23:00:00+09:00' }
	        
    //     */
    //   }
	// 	);
		// console.log(location.name);
		pipeline.hSet(key, "id", locationId);
        pipeline.hSet(key, "name", location.name || "");
        pipeline.hSet(key, "locality", location.locality || "");
        pipeline.hSet(key, "timezone", location.timezone || "");

        pipeline.hSet(key, "country", JSON.stringify(location.country || {}));
        pipeline.hSet(key, "owner", JSON.stringify(location.owner || {}));
        pipeline.hSet(key, "provider", JSON.stringify(location.provider || {}));

        pipeline.hSet(key, "isMobile", String(location.isMobile ?? false));
        pipeline.hSet(key, "isMonitor", String(location.isMonitor ?? false));

        pipeline.hSet(key, "instruments", JSON.stringify(location.instruments || []));
        pipeline.hSet(key, "sensors", JSON.stringify(location.sensors || []));

        pipeline.hSet(key, "coordinates", JSON.stringify(location.coordinates || {}));
        pipeline.hSet(key, "bounds", JSON.stringify(location.bounds || []));

        pipeline.hSet(key, "licenses", JSON.stringify(location.licenses ?? null));

        pipeline.hSet(key, "distance", location.distance != null ? String(location.distance) : "");

        pipeline.hSet(key, "datetimeFirst", JSON.stringify(location.datetimeFirst || {}));
        pipeline.hSet(key, "datetimeLast", JSON.stringify(location.datetimeLast || {}));

        pipeline.hSet(key, "updatedAt", new Date().toISOString());


	}
	
	await pipeline.exec();
}

/*
( async () => {
	try {
			const redisClient = await connect();// import
			
			const fetchedLocations = await fetchLocations();
			
			await setLocationsRedis (redisClient, fetchedLocations );
		
		console.log(`${fetchedLocations.length} locations saved to redis successfully `)
	} catch (e) {
    console.error("Error in IIFE:", e.message);
    process.exit(1);
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
})();

*/