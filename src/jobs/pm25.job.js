import { fetchSensors } from "../services/openaq/fetchSensors.js";
import { fetchLocations } from "../services/openaq/fetchLocations.js";

import { setSensorsRedis } from "../services/redis/sensor.cache.js";
import { setLocationsRedis } from "../services/redis/location.cache.js";

import { connect } from "../config/redis.js";
import { aggregateData } from "../services/aggregation/pm25.aggregate.js";


( async () => {
	const redisClient = await connect();// import
	try {
			
			const fetchedSensors = await fetchSensors();
			
			await setSensorsRedis(redisClient, fetchedSensors);
		
			console.log(`${fetchedSensors.length} sensors saved to redis successfully `)
			
			const fetchedLocations = await fetchLocations();
			// console.log(fetchedLocations)
			
			await setLocationsRedis (redisClient, fetchedLocations );
			
			console.log(`${fetchedLocations.length} locations saved to redis successfully `)
			// console.log(await redisClient.keys("*"));
			
			// const test = await redisClient.hGetAll("openaq:sensor:8539597");
			// console.log(test);

			await aggregateData(redisClient);
		
	} catch (e) {
    console.error("Error in IIFE:", e.message);
    process.exit(1);
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
})();