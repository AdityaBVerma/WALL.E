import dotenv from "dotenv";
dotenv.config();

import { connect } from "../config/redis.js";
import app from "./app.js";
import initDB from "../db/initDB.js";

const startServer = async () => {
  try {
    await initDB(); 
    const redisClient = await connect();
    
    app.locals.redis = redisClient;
		
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`※※ App is listening on port ※※ ${PORT}`);
    });
  } catch (e) {
    console.error("Error while starting app:", e.message);
    process.exit(1);
  }
};

startServer();


