import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { DynamicDatabaseService } from './dynamic-database.service';

@Controller('database')
export class DatabaseSwitchController {
    constructor(private readonly dynamicDbService: DynamicDatabaseService) {}

    /**
     * List all available databases
     */
    @Get('list')
    async listDatabases() {
        try {
            const databases = await this.dynamicDbService.listDatabases();
            return {
                success: true,
                databases,
                count: databases.length,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Get connection status for all databases
     */
    @Get('status')
    getConnectionStatus() {
        const status = this.dynamicDbService.getConnectionStatus();
        return {
            success: true,
            connections: status,
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Switch to a different database
     */
    @Post('switch/:dbName')
    async switchDatabase(@Param('dbName') dbName: string) {
        try {
            await this.dynamicDbService.switchDatabase(dbName);
            return {
                success: true,
                database: dbName,
                message: `Successfully switched to database: ${dbName}`,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                database: dbName,
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Get collections from a specific database
     */
    @Get('collections/:dbName')
    async getCollections(@Param('dbName') dbName: string) {
        try {
            const db = await this.dynamicDbService.getDatabase(dbName);
            const collections = await db.listCollections().toArray();

            return {
                success: true,
                database: dbName,
                collections: collections.map((col) => ({
                    name: col.name,
                    type: col.type,
                })),
                count: collections.length,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                database: dbName,
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Query a collection from any database
     */
    @Get('query/:dbName/:collectionName')
    async queryCollection(
        @Param('dbName') dbName: string,
        @Param('collectionName') collectionName: string,
        @Query('limit') limit = '10',
        @Query('skip') skip = '0',
    ) {
        try {
            const collection = await this.dynamicDbService.getCollection(dbName, collectionName);
            const documents = await collection.find({}).limit(parseInt(limit)).skip(parseInt(skip)).toArray();

            return {
                success: true,
                database: dbName,
                collection: collectionName,
                documents,
                count: documents.length,
                limit: parseInt(limit),
                skip: parseInt(skip),
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                database: dbName,
                collection: collectionName,
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }

    /**
     * Insert a document into any database/collection
     */
    @Post('insert/:dbName/:collectionName')
    async insertDocument(@Param('dbName') dbName: string, @Param('collectionName') collectionName: string, @Body() document: any) {
        try {
            const collection = await this.dynamicDbService.getCollection(dbName, collectionName);
            const result = await collection.insertOne({
                ...document,
                createdAt: new Date(),
            });

            return {
                success: true,
                database: dbName,
                collection: collectionName,
                insertedId: result.insertedId,
                message: 'Document inserted successfully',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                success: false,
                database: dbName,
                collection: collectionName,
                error: error.message,
                timestamp: new Date().toISOString(),
            };
        }
    }
}
