import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

// Bağlantı bilgilerini kontrol etmek için loglayalım
console.log('Database Connection Config:', {
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    port: process.env.PGPORT
});

export const sequelize = new Sequelize({
    database: process.env.PGDATABASE,
    username: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432', 10),
    dialect: 'postgres',
    dialectModule: pg,
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        connectTimeout: 60000
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
    }
});

export async function connectDB(retries = 5) {
    try {
        console.log('Attempting to connect to database...');
        await sequelize.authenticate();
        console.log('Successfully connected to PostgreSQL database.');
        
        console.log('Syncing database tables...');
        await sequelize.sync({ alter: true });
        console.log('Database tables updated.');
        
        console.log('Initializing servers...');
        await initializeServers();
        console.log('Servers initialized successfully.');
        return true;
    } catch (err: Error | unknown) {
        const error = err as Error & {
            original?: {
                code?: string;
                errno?: number;
                sqlState?: string;
            };
        };
        
        console.error('Detailed Database Error:', {
            message: error.message,
            code: error.original?.code,
            errno: error.original?.errno,
            sqlState: error.original?.sqlState,
            stack: error.stack
        });

        if (retries > 0) {
            console.log(`Connection failed, ${retries} attempts remaining. Retrying in 5 seconds...`);
            await new Promise(res => setTimeout(res, 5000));
            return connectDB(retries - 1);
        }
        throw err;
    }
}

async function initializeServers() {
    const Server = (await import('@/models/Server')).default;
    
    const defaultServers = [
        { url: 'http://213.210.20.204:3010/login', name: 'Server 3010' },
        { url: 'http://213.210.20.204:4000', name: 'Server 4000' },
        { url: 'https://dashboard.giteks.com.tr/login', name: 'Dashboard' }
    ];

    for (const server of defaultServers) {
        await Server.findOrCreate({
            where: { url: server.url },
            defaults: server
        });
    }
} 