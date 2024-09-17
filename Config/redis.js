import { createClient } from "redis";

const redisPublisher = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: "redis-12087.c325.us-east-1-4.ec2.redns.redis-cloud.com",
    port: 12087,
  },
}).on("error", (err) => console.log("Redis Publisher Error", err));
const redisSubscriber = redisPublisher.duplicate();

const connectRedis = async () => {
  try {
    await redisSubscriber.connect();
    await redisPublisher.connect();

    console.log(`Connected to Redis server`);
  } catch (error) {
    console.log(`could not connect to redis server:->`, error);
  }
};

export { redisPublisher, redisSubscriber, connectRedis };
