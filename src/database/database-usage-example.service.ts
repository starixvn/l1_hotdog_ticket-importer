import { Injectable, Logger } from '@nestjs/common';
import { DynamicDatabaseService } from './dynamic-database.service';

@Injectable()
export class DatabaseUsageExampleService {
    private readonly logger = new Logger(DatabaseUsageExampleService.name);

    constructor(private readonly dynamicDbService: DynamicDatabaseService) {}

    /**
     * Example: Switch between different databases based on user context
     */
    async switchDatabaseByUser(userId: string, userType: string) {
        let targetDatabase: string;

        // Determine database based on user type
        switch (userType) {
            case 'admin':
                targetDatabase = 'hotdog_admin';
                break;
            case 'operator':
                targetDatabase = 'hotdog_operator';
                break;
            case 'player':
                targetDatabase = 'hotdog_player';
                break;
            default:
                targetDatabase = 'hotdog_minigame';
        }

        this.logger.log(`Switching to ${targetDatabase} for user ${userId} (${userType})`);

        try {
            const db = await this.dynamicDbService.switchDatabase(targetDatabase);
            return {
                success: true,
                database: targetDatabase,
                userId,
                userType,
            };
        } catch (error) {
            this.logger.error(`Failed to switch to ${targetDatabase}:`, error);
            throw error;
        }
    }

    /**
     * Example: Query data from multiple databases
     */
    async queryFromMultipleDatabases() {
        const results = {};

        try {
            // Query from primary database
            const primaryDb = await this.dynamicDbService.getDatabase('hotdog_minigame');
            const primaryData = await primaryDb.collection('ticket_silos').countDocuments();
            results['hotdog_minigame'] = { ticketCount: primaryData };

            // Query from secondary database if it exists
            try {
                const secondaryDb = await this.dynamicDbService.getDatabase('hotdog_secondary');
                const secondaryData = await secondaryDb.collection('ticket_silos').countDocuments();
                results['hotdog_secondary'] = { ticketCount: secondaryData };
            } catch (error) {
                this.logger.warn('Secondary database not available:', error.message);
            }

            // Query from admin database
            try {
                const adminDb = await this.dynamicDbService.getDatabase('admin');
                const adminData = await adminDb.collection('system.users').countDocuments();
                results['admin'] = { userCount: adminData };
            } catch (error) {
                this.logger.warn('Admin database not accessible:', error.message);
            }

            return {
                success: true,
                results,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            this.logger.error('Failed to query from multiple databases:', error);
            throw error;
        }
    }

    /**
     * Example: Migrate data between databases
     */
    async migrateData(sourceDb: string, targetDb: string, collectionName: string) {
        this.logger.log(`Starting migration from ${sourceDb} to ${targetDb} for collection ${collectionName}`);

        try {
            const sourceCollection = await this.dynamicDbService.getCollection(sourceDb, collectionName);
            const targetCollection = await this.dynamicDbService.getCollection(targetDb, collectionName);

            // Get all documents from source
            const documents = await sourceCollection.find({}).toArray();
            this.logger.log(`Found ${documents.length} documents to migrate`);

            if (documents.length > 0) {
                // Insert into target database
                const result = await targetCollection.insertMany(documents);
                this.logger.log(`Successfully migrated ${result.insertedCount} documents`);

                return {
                    success: true,
                    sourceDb,
                    targetDb,
                    collectionName,
                    migratedCount: result.insertedCount,
                    timestamp: new Date().toISOString(),
                };
            } else {
                return {
                    success: true,
                    sourceDb,
                    targetDb,
                    collectionName,
                    migratedCount: 0,
                    message: 'No documents to migrate',
                    timestamp: new Date().toISOString(),
                };
            }
        } catch (error) {
            this.logger.error('Migration failed:', error);
            throw error;
        }
    }

    /**
     * Example: Backup data from multiple databases
     */
    async backupDatabases(databases: string[]) {
        const backupResults = {};

        for (const dbName of databases) {
            try {
                this.logger.log(`Starting backup for database: ${dbName}`);
                const db = await this.dynamicDbService.getDatabase(dbName);
                const collections = await db.listCollections().toArray();

                const dbBackup = {};
                for (const collection of collections) {
                    const collectionName = collection.name;
                    const documents = await db.collection(collectionName).find({}).toArray();
                    dbBackup[collectionName] = {
                        count: documents.length,
                        sample: documents.slice(0, 5), // First 5 documents as sample
                    };
                }

                backupResults[dbName] = {
                    success: true,
                    collections: Object.keys(dbBackup).length,
                    data: dbBackup,
                };

                this.logger.log(`Backup completed for ${dbName}: ${Object.keys(dbBackup).length} collections`);
            } catch (error) {
                this.logger.error(`Backup failed for ${dbName}:`, error);
                backupResults[dbName] = {
                    success: false,
                    error: error.message,
                };
            }
        }

        return {
            success: true,
            backupResults,
            timestamp: new Date().toISOString(),
        };
    }
}
