import { pool } from "./db.js";

const initDB = async () => {
	const client = await pool.connect();

	try{
	/*
	* better to have many parameters in the same table for future as the new table and new indexes for each parameter will be over kill
	*/
		await client.query("BEGIN");
		
		await pool.query(`
			CREATE TABLE IF NOT EXISTS sensor_data(
					time TIMESTAMPTZ NOT NULL,
					ingest_time TIMESTAMPTZ DEFAULT NOW(),
					sensor_id BIGINT NOT NULL,
					location_id BIGINT ,
					value DOUBLE PRECISION,
					parameter TEXT,
					PRIMARY KEY (sensor_id, parameter, time)
			);
		`);
		
	/*
	* after thinking and searching (gpt) i decided not to further normalize this location table as there are few entries int the location table
	* cuz the overhead of many JOINS will degrade the perfomance more than the redundant data
	*/
		await pool.query(`
			CREATE TABLE IF NOT EXISTS locations(
				id BIGINT PRIMARY KEY,
				country TEXT,
				timezone TEXT,
				name TEXT,
				latitude DOUBLE PRECISION,
				longitude DOUBLE PRECISION
			);
		`);
		
		/*
		* chunk size of 24 hrs for the hous table in 24 hour
		*/
		await pool.query(`
			SELECT create_hypertable(
				'sensor_data',
				'time',
				chunk_time_interval => INTERVAL '1 day',
				if_not_exists => TRUE
			);
		`);
		
		/*
		* indexing on sensor_id even though the hypertable does it for the time but querying  based on the sensor_id will be faster 
		* avoiding to add many indexes so as to not make the write operations slower 
		*/
		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_sensor_time ON sensor_data (sensor_id, time DESC);
		`);
		
		/*
		* compressing by sensor id so that the columanar format similar to apache paraquet
		* querying of data of a particular sensor would only uncompress and compress one paraquet like data
		*/
		await pool.query(`
			ALTER TABLE sensor_data
			SET (
				timescaledb.compress = true,
				timescaledb.compress_segmentby = 'sensor_id',
				timescaledb.compress_orderby = 'time DESC'
			)
		`);
		
		/*
		* compressing data older than 7 days for the days tab as it would be okay for it to be of 7 days
		*/
		await pool.query(`
			SELECT add_compression_policy(
				'sensor_data',
				INTERVAL '7 days',
				if_not_exists => TRUE
			);
		`);
		
		await client.query("COMMIT");
		
		console.log("Timescale DB Ready");
		
	} catch (e){
		await client.query("ROLLBACK");
	
		console.error("error at timescale init" , e);
	}	finally {
    client.release();
  }
}

export default initDB;