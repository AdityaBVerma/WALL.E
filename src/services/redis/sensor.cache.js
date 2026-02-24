
export const setSensorsRedis = async (redis, sensors) => {
    const pipeline = redis.multi();
    for(const sensor of sensors){

        if (!sensor?.sensorsId || !sensor?.locationsId){
          continue;
        }

        const sensorId = sensor.sensorsId.toString();
        // console.log(sensor.value)
        pipeline.sAdd("openaq:sensors:ids", sensorId);
        const key = `openaq:sensor:${sensorId}`;

        pipeline.hSet(key, "id", String(sensorId));
        pipeline.hSet(key, "locationId", String(sensor.locationsId ?? ""));
        pipeline.hSet(key, "value", String(sensor.value ?? "0"));
        pipeline.hSet(key, "coordinates", JSON.stringify(sensor.coordinates || {}));
        pipeline.hSet(key, "datetime", JSON.stringify(sensor.datetime || {}));
        pipeline.hSet(key, "updatedAt", new Date().toISOString());

    }
    
    await pipeline.exec();
}

/*

( async () => {
    try {
            const redisClient = await connect();// import
            
            const fetchedSensors = await fetchSensors();
            
            await setSensorsRedis(redisClient, fetchedSensors);
        
        console.log(`${fetchedSensors.length} sensors saved to redis successfully `)
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