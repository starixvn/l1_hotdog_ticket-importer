import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class DynamicDatabaseService {
    private readonly logger = new Logger(DynamicDatabaseService.name);
    private client: MongoClient;
    private connections: Map<string, Db> = new Map();

    constructor(private readonly configService: ConfigService) {
        this.initializeClient();
    }

    private async initializeClient() {
        try {
            const baseUri = this.configService.get<string>('database.uri');
            this.client = new MongoClient(baseUri, {
                retryWrites: true,
                w: 'majority',
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                connectTimeoutMS: 10000,
            });

            await this.client.connect();
            this.logger.log('✅ Dynamic MongoDB client connected successfully');
        } catch (error) {
            this.logger.error('❌ Failed to initialize dynamic MongoDB client:', error);
            throw error;
        }
    }

    /**
     * Get a database connection by name
     * @param dbName - The name of the database to connect to
     * @returns Promise<Db> - The database instance
     */
    async getDatabase(dbName: string): Promise<Db> {
        if (!this.client) {
            await this.initializeClient();
        }

        // Check if we already have a connection to this database
        if (this.connections.has(dbName)) {
            return this.connections.get(dbName)!;
        }

        try {
            const db = this.client.db(dbName);

            // Test the connection
            await db.admin().ping();

            this.connections.set(dbName, db);
            this.logger.log(`✅ Connected to database: ${dbName}`);

            return db;
        } catch (error) {
            this.logger.error(`❌ Failed to connect to database ${dbName}:`, error);
            throw error;
        }
    }

    /**
     * Get a collection from a specific database
     * @param dbName - The name of the database
     * @param collectionName - The name of the collection
     * @returns Promise<Collection> - The collection instance
     */
    async getCollection(dbName: string, collectionName: string) {
        const db = await this.getDatabase(dbName);
        return db.collection(collectionName);
    }

    /**
     * List all available databases
     * @returns Promise<string[]> - Array of database names
     */
    async listDatabases(): Promise<string[]> {
        if (!this.client) {
            await this.initializeClient();
        }

        try {
            const adminDb = this.client.db().admin();
            const result = await adminDb.listDatabases();
            return result.databases.map((db) => db.name);
        } catch (error) {
            this.logger.error('❌ Failed to list databases:', error);
            throw error;
        }
    }

    /**
     * Switch to a different database at runtime
     * @param dbName - The name of the database to switch to
     * @returns Promise<Db> - The new database instance
     */
    async switchDatabase(dbName: string): Promise<Db> {
        this.logger.log(`🔄 Switching to database: ${dbName}`);
        return await this.getDatabase(dbName);
    }

    /**
     * Close all database connections
     */
    async closeConnections(): Promise<void> {
        try {
            if (this.client) {
                await this.client.close();
                this.connections.clear();
                this.logger.log('🔒 All database connections closed');
            }
        } catch (error) {
            this.logger.error('❌ Error closing database connections:', error);
        }
    }

    /**
     * Get connection status for all databases
     */
    getConnectionStatus(): { [dbName: string]: boolean } {
        const status: { [dbName: string]: boolean } = {};
        for (const [dbName, db] of this.connections) {
            status[dbName] = db.databaseName === dbName;
        }
        return status;
    }
}
