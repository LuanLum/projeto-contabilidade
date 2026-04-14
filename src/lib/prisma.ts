import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

console.log("Prisma: Conectando ao banco com connectionString (masked):", connectionString?.replace(/:([^@]+)@/, ":****@"));

const pool = new pg.Pool({ 
  connectionString,
  ssl: { 
    rejectUnauthorized: false
  }
});

// Força o fechamento de conexões antigas se o hot reload acontecer
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});
const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
