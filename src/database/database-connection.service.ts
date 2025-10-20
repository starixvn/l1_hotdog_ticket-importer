import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseConnectionService implements OnModuleInit {
    private readonly logger = new Logger(DatabaseConnectionService.name);

    constructor(@InjectConnection() private readonly connection: Connection) {}

    async onModuleInit() {
        // Set up connection event listeners
        this.setupConnectionListeners();
    }

    private setupConnectionListeners() {
        this.connection.on('connected', () => {
            console.log('✅ MongoDB connected successfully!');
            console.log(`   Host: ${this.connection.host}`);
            console.log(`   Port: ${this.connection.port}`);
            console.log(`   Database: ${this.connection.name}`);
            console.log(`   Ready State: ${this.connection.readyState}`);
            console.log(`   Connection String: ${this.connection.host}:${this.connection.port}/${this.connection.name}`);

            this.logger.log('✅ MongoDB connected successfully!');
            this.logger.log(`   Host: ${this.connection.host}`);
            this.logger.log(`   Port: ${this.connection.port}`);
            this.logger.log(`   Database: ${this.connection.name}`);
            this.logger.log(`   Ready State: ${this.connection.readyState}`);
        });

        this.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
            this.logger.warn('⚠️ MongoDB disconnected');
        });

        this.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error.message);
            this.logger.error('❌ MongoDB connection error:', error);

            // Provide specific guidance for common errors
            if (error.message.includes('Authentication failed')) {
                console.error('💡 Authentication failed - Please check:');
                console.error('   - Username and password are correct');
                console.error('   - User has proper permissions on the database');
                console.error('   - Authentication database is correct (try admin)');
                console.error('   - Network connectivity to MongoDB servers');
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                console.error('💡 Connection failed - Please check:');
                console.error('   - MongoDB servers are running and accessible');
                console.error('   - Network connectivity and firewall settings');
                console.error('   - Host and port configuration');
            }
        });

        this.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
            this.logger.log('🔄 MongoDB reconnected');
        });

        this.connection.on('close', () => {
            console.log('🔒 MongoDB connection closed');
            this.logger.log('🔒 MongoDB connection closed');
        });
    }

    getConnectionStatus() {
        return {
            readyState: this.connection.readyState,
            host: this.connection.host,
            port: this.connection.port,
            name: this.connection.name,
            isConnected: this.connection.readyState === 1,
        };
    }
}
