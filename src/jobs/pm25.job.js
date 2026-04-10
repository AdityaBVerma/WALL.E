import { fetchSensors } from "../services/openaq/fetchSensors.js";
import { fetchLocations } from "../services/openaq/fetchLocations.js";

import { setSensorsRedis } from "../services/redis/sensor.cache.js";
import { setLocationsRedis } from "../services/redis/location.cache.js";

import { connect } from "../config/redis.js";
import { aggregateData } from "../services/aggregation/pm25.aggregate.js";

import initDB from "../db/initDB.js";
import { insertAggregated } from "../services/timescaledb/insertAggregated.js";
import { insertLocation } from "../services/timescaledb/insertLocation.js";

( async () => {
	const redisClient = await connect();// import
	// timescale db init
    await initDB();

	try {
			
			const fetchedSensors = await fetchSensors();
			
			await setSensorsRedis(redisClient, fetchedSensors);
		
			console.log(`${fetchedSensors.length} sensors saved to redis successfully `)
			
			const fetchedLocations = await fetchLocations();
			// console.log(fetchedLocations)
			
			await setLocationsRedis (redisClient, fetchedLocations );
			
			console.log(`${fetchedLocations.length} locations saved to redis successfully `)
			// console.log(await redisClient.keys("*"));
			
			// put in locations table
			await insertLocation(fetchLocations);

			// const test = await redisClient.hGetAll("openaq:sensor:8539597");
			// console.log(test);

			const aggregatedData = await aggregateData(redisClient);

			// put in timescale db
			await insertAggregated(aggregatedData);
		
			console.log("Data inserted");
	} catch (e) {
    console.error("Error in IIFE:", e);
    process.exit(1);
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
})();