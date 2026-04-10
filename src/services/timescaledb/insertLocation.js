import { pool } from "../../db/db.js";

export const insertLocation  = async (locations) => {

    const client = await pool.connect();
    try {
        /*
        * send in batches as postgresql has limits of $i up to 65535 
        * i.e. 65535 / 6 ≈ 10,922 rows per batch so i am doing like 5k rows at a time
        */

        const batchSize = 5000;
        for(let j = 0 ; j < locations.length ; j+= batchSize){
                const batch = locations.slice(j, j+batchSize);			
                const values = [];
                const placeholders= [];
                
                batch.forEach((row, i) => {
                
                    const idx = i* 6;
                    
                    values.push(row.id);
                    values.push(row.country?.name || null);
                    values.push(row.timezone || null);
                    values.push(row.name || null);
                    values.push(row.coordinates?.latitude || null);
                    values.push(row.coordinates?.longitude || null);
                    
                    placeholders.push(
                        `($${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4},$${idx + 5},$${idx + 6} )`
                    );
                    
                });
                
                const query = `
                    INSERT INTO locations
                    (id, country, timezone, name, latitude, longitude)
                    VALUES ${placeholders.join(",")}
                    ON CONFLICT (id)
                    DO UPDATE SET 
                        country = EXCLUDED.country,
                        timezone = EXCLUDED.timezone,
                        name = EXCLUDED.name,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude
                    WHERE
                        locations.country IS DISTINCT FROM EXCLUDED.country OR
                        locations.timezone IS DISTINCT FROM EXCLUDED.timezone OR
                        locations.name IS DISTINCT FROM EXCLUDED.name OR
                        locations.latitude IS DISTINCT FROM EXCLUDED.latitude OR
                        locations.longitude IS DISTINCT FROM EXCLUDED.longitude
                `
                try {
                    await client.query("BEGIN");
                    await client.query(query, values);
                    await client.query("COMMIT");

                    console.log(`Inserted batch ${(j / batchSize) + 1}`);
                } catch (err) {
                    await client.query("ROLLBACK");
                    throw error;
                }
            }
    } catch (error) {
        console.error("timescale db location",  error.message);
    } finally {
        client.release();
    }
}