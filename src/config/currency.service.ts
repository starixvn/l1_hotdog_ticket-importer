import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { CurrencyMappingConfig, CurrencyMappingLookup } from './currency.interface';

@Injectable()
export class CurrencyService {
    private readonly logger = new Logger(CurrencyService.name);
    private readonly currencyMappings: CurrencyMappingLookup = {};

    constructor() {
        this.loadCurrencyMappings();
    }

    private loadCurrencyMappings(): void {
        try {
            // Use process.cwd() to get the project root, then navigate to src/config
            const mappingPath = join(process.cwd(), 'src', 'config', 'currency-mapping.json');
            const mappingData: CurrencyMappingConfig = JSON.parse(readFileSync(mappingPath, 'utf8'));

            // Create lookup map for faster access
            mappingData.currencyMappings.forEach((mapping) => {
                this.currencyMappings[mapping.currencyName] = mapping.currencyISO;
            });

            this.logger.log(`Loaded ${mappingData.currencyMappings.length} currency mappings`);
        } catch (error) {
            this.logger.error('Failed to load currency mapping configuration:', error);
            throw new Error('Currency mapping configuration could not be loaded');
        }
    }

    /**
     * Map currency name to ISO currency code
     */
    mapCurrencyNameToISO(currencyName: string): string | undefined {
        return this.currencyMappings[currencyName];
    }
}
