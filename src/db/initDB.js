import { pool } from "./db.js";

const initDB = async () => {
	const client = await pool.connect();

	try{
	/*
	* better to have many parameters in the same table for future as the new table and new indexes for each parameter will be over kill
	*/
		await client.query("BEGIN");
		
		/**
		 * here taking primary key as (sensor_id, parameter, time) so that i wont have to later insert unchanged values as there are many dormant sensors 
		 */
		await client.query(`
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
		await client.query(`
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
		await client.query(`
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
		await client.query(`
			CREATE INDEX IF NOT EXISTS idx_sensor_time ON sensor_data (sensor_id, time DESC);
		`);
		
		/*
		* compressing by sensor id so that the columanar format similar to apache paraquet
		* querying of data of a particular sensor would only uncompress and compress one paraquet like data
		*/
		await client.query(`
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
		await client.query(`
			SELECT add_compression_policy(
				'sensor_data',
				INTERVAL '7 days',
				if_not_exists => TRUE
			);
		`);
		
		/**
		 * 1. We are using here materialized view so that the data is not retrieved everytime form the db for each request
		 * 
		 * we were initialy using a normalized materialized view 
		 * how it was fetching int the cron job everyday
		 * 
		 * SET max_parallel_workers_per_gather = 0;
		 * REFRESH MATERIALIZED VIEW monthly_pm25;
		 * 
		 * PROBLEM with this was that it accquired many locks like if 3 workers then 90+ as today is april just to fetch the data from Jan - Apr
		 * but i was planing to expand this to like many years and many months so the locks would come to be 2k+ for a year as and 10k+ for 5 years
		 * 
		 * NOTE the number of locks are huge as each chunk required a lock to and then when running parallel workers before it was acquiring many locks 
		 * hence it was throwing out of shared memory error then i max_parallel_workers_per_gather = 0 
		 * i could also have increased the number of locks that the postgre can acquire but till when 1024 i guess was max
		 * 
		 * so i am using continuous aggregation it will recompute 6 months data everytime so like not that many locks are required now
		 * it will now recompute last 6 months data every day
		 */
		await client.query(`
			DROP MATERIALIZED VIEW IF EXISTS monthly_pm25;
		`);

		await client.query(`
			CREATE MATERIALIZED VIEW monthly_pm25
			WITH (timescaledb.continuous) AS
			SELECT 
				l.name AS city,
				time_bucket('1 month', s.time) AS month,
				AVG(s.value) AS avg_pm25
			FROM sensor_data s
			JOIN locations l ON s.location_id = l.id
			WHERE s.parameter = 'pm2.5'
			GROUP BY city, month;
		`);
		
		await client.query(`
			SELECT add_continuous_aggregate_policy(
				'monthly_pm25',
				start_offset => INTERVAL '6 months',
				end_offset => INTERVAL '1 hour',
				schedule_interval => INTERVAL '1 day'
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