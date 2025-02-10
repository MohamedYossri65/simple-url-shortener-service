import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private pool: Pool;

    constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || "5432", 10),
        });

        this.pool.on('connect', () => {
            console.log('✅ Database connected successfully');
        });

        this.pool.on('error', (err) => {
            console.error('❌ Database connection error:', err);
        });
    }

    async onModuleInit() {
        try {
            const client = await this.pool.connect();
            client.release();
            console.log('🔄 Initial database connection established');
        } catch (error) {
            console.error('❌ Failed to connect to the database:', error);
        }
    }

    async query(text: string, params?: any[]) {
        try {
            const result = await this.pool.query(text, params);
            return result.rows;
        } catch (err) {
            console.error('❌ Database query error:', err);
            throw err;
        }
    }

    async onModuleDestroy() {
        await this.pool.end();
        console.log('🚪 Database connection closed');
    }
}
