import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

export const connect = async () => {
	try {
		const client = await createClient({
			url : process.env.REDIS_URI || "redis://localhost:6379"
		})
		.on("error", (err) => console.error("Redis Client Error", err))
		.connect();
		
		console.log("redis connection established");
		
		return client;
	} catch (e){
		console.log("Failed to connect redis : ", e.message);
		throw e;
	}
}
