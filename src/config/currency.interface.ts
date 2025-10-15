export interface CurrencyMapping {
    currencyName: string;
    currencyISO: string;
    description: string;
    multiplier: number;
}

export interface CurrencyMappingConfig {
    currencyMappings: CurrencyMapping[];
}

export interface CurrencyMappingLookup {
    [currencyName: string]: string;
}
