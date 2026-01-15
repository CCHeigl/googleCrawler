/**
 * Google Maps Crawler - Main Entry Point
 * 
 * This application crawls Google Maps to extract business information
 * based on branch name (business type) and postal code.
 */

const GoogleMapsCrawler = require('./src/GoogleMapsCrawler');
const { getUserInput, isValidGermanPostalCode, isValidBranchName } = require('./src/utils');

/**
 * Main execution function
 */
async function main() {
    const crawler = new GoogleMapsCrawler();

    try {
        // Get user input
        console.log('\n=== Google Maps Crawler ===\n');

        const branchName = await getUserInput('Bitte geben Sie die Branche ein (z.B. restaurants, zahnarzt, apotheke): ');
        const postalCode = await getUserInput('Bitte geben Sie die Postleitzahl ein (z.B. 44388, 10001): ');

        // Validate inputs
        if (!isValidBranchName(branchName)) {
            console.error('Fehler: Bitte geben Sie eine gültige Branche ein!');
            return;
        }

        if (!isValidGermanPostalCode(postalCode)) {
            console.error('Fehler: Bitte geben Sie eine gültige deutsche Postleitzahl ein (5 Ziffern)!');
            return;
        }

        console.log(`\nStarte Suche nach "${branchName}" in "${postalCode}"...\n`);

        // Initialize crawler and search
        await crawler.initialize();
        const results = await crawler.searchBusinesses(branchName, postalCode);

        // Display results
        console.log('\n=== ERGEBNISSE ===');
        results.forEach((business, index) => {
            console.log(`\n${index + 1}. ${business.name}`);
            console.log(`   Adresse: ${business.address || 'N/A'}`);
            console.log(`   Telefon: ${business.phone || 'N/A'}`);
        });

        // Save to JSON file
        await crawler.saveToJSON(results, 'google_maps_results.json');

    } catch (error) {
        console.error('Fehler bei der Ausführung:', error.message);
    } finally {
        await crawler.close();
    }
}

// Run the crawler
if (require.main === module) {
    main().catch(console.error);
}

module.exports = GoogleMapsCrawler;
