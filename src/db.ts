import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, car_state } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type CarState = car_state;
type CarStateUpdate = Omit<CarState, "id">;

export { prisma, CarState, CarStateUpdate };