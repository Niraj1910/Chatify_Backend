import { createClient } from "redis";

const redisPublisher = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: "redis-12087.c325.us-east-1-4.ec2.redns.redis-cloud.com",
    port: 12087,
    connectTimeout: 10000, // Increase timeout to 10 seconds
  },
}).on("error", (err) => console.log("Redis Publisher Error", err));
const redisSubscriber = redisPublisher.duplicate();

const connectRedis = async () => {
  let retries = 5;

  while (retries) {
    try {
      await redisSubscriber.connect();
      await redisPublisher.connect();

      console.log(`Connected to Redis server`);
      break;
    } catch (error) {
      retries -= 1;
      console.error(`Redis connection failed, retrying...`, error);

      if (retries === 0) {
        console.error("Could not connect to redis even after 5 retries");
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

export { redisPublisher, redisSubscriber, connectRedis };
