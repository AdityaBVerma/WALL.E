import { pool } from "../../db/db.js";

export const insertAggregated  = async (aggregated) => {
	const client = await pool.connect();
	try {
		
		/*
		* send in batches as postgresql has limits of $i up to 65535 
		* i.e. 65535 / 5 ≈ 13,107 rows per batch so i am doing like 5k rows at a time
		*/
		const batchSize = 5000;
		for(let j = 0 ; j < aggregated.length ; j+= batchSize){
				const batch = aggregated.slice(j, j+batchSize);			
				const values = [];
				const placeholders= [];
				
				batch.forEach((row, i) => {
				
					const idx = i* 5;
					
					values.push(row.datetime?.utc);
					values.push(row.sensorsId);
					values.push(row.locationsId);
					values.push("pm2.5");
					values.push(row.value);
					
					placeholders.push(
						`($${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4},$${idx + 5} )`
					);
					
				});
				
				const query = `
					INSERT INTO sensor_data
					(time, sensor_id, location_id, parameter, value)
					VALUES ${placeholders.join(",")}
					ON CONFLICT (sensor_id, parameter, time)
					DO UPDATE SET value = EXCLUDED.value
				`
				try {
					await client.query('BEGIN');
					await client.query(query, values);
					await client.query('COMMIT');
					console.log(`Inserted batch ${(j / batchSize) + 1}`);
				} catch (error) {
					await client.query('ROLLBACK');
					throw error;
				}
		}
	} catch (error) {
		console.error("timescale sensor error: ", error.message);
	} finally {
		client.release();
	}
}