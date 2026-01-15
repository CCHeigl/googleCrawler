const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const readline = require('readline');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Helper function to wait/delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get user input
function getUserInput(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

class GoogleMapsCrawler {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        console.log('Initializing browser...');
        this.browser = await puppeteer.launch({
            headless: false, // Visible mode
            defaultViewport: null,
            args: [
                '--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox'
            ]
        });
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }

    async searchBusinesses(branchName, postalCode) {
        try {
            console.log(`Searching for: ${branchName} in ${postalCode}`);

            // Navigate to Google Maps
            const searchQuery = `${branchName} ${postalCode}`;
            const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

            await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Wait for page to load
            await delay(2000);

            // Handle cookie consent if present
            try {
                console.log('Checking for cookie consent dialog...');

                // Wait for cookie dialog to appear
                await delay(2000);

                // Try to find and click the "Accept all" button using various methods
                const cookieHandled = await this.page.evaluate(() => {
                    // Look for buttons with specific text content
                    const buttons = Array.from(document.querySelectorAll('button'));

                    // Try to find "Accept all" or "Alle akzeptieren" button
                    const acceptButton = buttons.find(btn => {
                        const text = btn.textContent.toLowerCase();
                        return text.includes('accept all') ||
                            text.includes('alle akzeptieren') ||
                            text.includes('alles akzeptieren') ||
                            text.includes('ich stimme zu');
                    });

                    if (acceptButton) {
                        acceptButton.click();
                        return true;
                    }

                    // Alternative: look for the second button in a form (usually "Accept all")
                    const forms = document.querySelectorAll('form');
                    if (forms.length > 0) {
                        const formButtons = forms[0].querySelectorAll('button');
                        if (formButtons.length >= 2) {
                            formButtons[1].click(); // Usually the "Accept all" button
                            return true;
                        }
                    }

                    return false;
                });

                if (cookieHandled) {
                    console.log('Cookie consent accepted');
                    await delay(3000);
                } else {
                    console.log('No cookie consent dialog found or already accepted');
                }
            } catch (error) {
                console.log('Cookie handling completed:', error.message);
            }

            // Wait for results to load after cookie handling
            await delay(4000);

            // Check if results exist
            const resultsExist = await this.page.$('[role="feed"]');
            if (!resultsExist) {
                console.log('No results found');
                return [];
            }

            // Scroll to load all results
            await this.scrollResults();

            // Extract business data
            const businesses = await this.extractBusinessData();

            // Remove duplicates
            const uniqueBusinesses = this.removeDuplicates(businesses);

            console.log(`Found ${uniqueBusinesses.length} unique businesses`);
            return uniqueBusinesses;

        } catch (error) {
            console.error('Error during search:', error.message);
            throw error;
        }
    }

    async scrollResults() {
        console.log('Scrolling through results...');

        const scrollableSelector = '[role="feed"]';

        try {
            let previousHeight = 0;
            let scrollAttempts = 0;
            const maxScrollAttempts = 10;

            while (scrollAttempts < maxScrollAttempts) {
                // Scroll the results panel
                const currentHeight = await this.page.evaluate((selector) => {
                    const scrollableDiv = document.querySelector(selector);
                    if (scrollableDiv) {
                        scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
                        return scrollableDiv.scrollHeight;
                    }
                    return 0;
                }, scrollableSelector);

                // Wait for new content to load
                await delay(2000);

                // Check if we've reached the end
                if (currentHeight === previousHeight) {
                    console.log('Reached end of results');
                    break;
                }

                previousHeight = currentHeight;
                scrollAttempts++;
                console.log(`Scroll attempt ${scrollAttempts}/${maxScrollAttempts}`);
            }
        } catch (error) {
            console.log('Scrolling completed with minor issues:', error.message);
        }
    }

    async extractBusinessData() {
        console.log('Extracting business data...');

        // Debug: Check what's on the page
        const debugInfo = await this.page.evaluate(() => {
            const feed = document.querySelector('[role="feed"]');
            if (!feed) return { hasFeed: false };

            const allLinks = feed.querySelectorAll('a');
            return {
                hasFeed: true,
                totalLinks: allLinks.length,
                feedHTML: feed.innerHTML.substring(0, 500) // First 500 chars for debugging
            };
        });

        console.log('Debug info:', debugInfo);

        const businesses = await this.page.evaluate(() => {
            const results = [];

            // Find all article elements (each represents a business listing)
            const articles = document.querySelectorAll('div[role="article"]');

            console.log('Found articles:', articles.length);

            articles.forEach((article) => {
                try {
                    // Get the main link element
                    const link = article.querySelector('a.hfpxzc');
                    if (!link) return;

                    // Extract company name from aria-label
                    const ariaLabel = article.getAttribute('aria-label') || link.getAttribute('aria-label');
                    const name = ariaLabel ? ariaLabel.trim() : null;

                    // Skip if no name found
                    if (!name) return;

                    // Try to extract address from the article
                    let address = null;

                    // Look for address in various possible locations
                    const addressElements = article.querySelectorAll('div[class*="fontBodyMedium"]');
                    addressElements.forEach(el => {
                        const text = el.textContent.trim();
                        // Check if it looks like an address (contains numbers or common address keywords)
                        if (text.match(/\d+/) || text.includes('Straße') || text.includes('Str.') || text.includes('Weg') || text.includes('Platz')) {
                            if (!address || text.length > address.length) {
                                address = text;
                            }
                        }
                    });

                    // Extract phone number - will need to click on listing for this
                    // For now, we'll mark it as null and extract it in a second pass

                    results.push({
                        name: name,
                        address: address,
                        phone: null,
                        listingElement: link.href || null
                    });

                } catch (error) {
                    console.error('Error extracting business:', error);
                }
            });

            return results;
        });

        // Second pass: click on each listing to get phone number
        console.log(`Extracting detailed info for ${businesses.length} businesses...`);

        for (let i = 0; i < businesses.length; i++) {
            try {
                console.log(`Processing business ${i + 1}/${businesses.length}: ${businesses[i].name}`);

                // Click on the listing using the article elements
                const articles = await this.page.$$('div[role="article"]');
                if (articles[i]) {
                    const link = await articles[i].$('a.hfpxzc');
                    if (link) {
                        await link.click();
                        await delay(2000);

                        // Extract phone number and address from detail panel
                        const details = await this.page.evaluate(() => {
                            let phone = null;
                            let address = null;

                            // Look for phone number
                            const phoneButtons = document.querySelectorAll('button[data-item-id^="phone"]');
                            if (phoneButtons.length > 0) {
                                const phoneText = phoneButtons[0].getAttribute('data-item-id');
                                if (phoneText) {
                                    phone = phoneText.replace('phone:tel:', '').trim();
                                }
                            }

                            // Alternative phone search
                            if (!phone) {
                                const allButtons = document.querySelectorAll('button[aria-label*="Phone"]');
                                allButtons.forEach(btn => {
                                    const ariaLabel = btn.getAttribute('aria-label');
                                    if (ariaLabel && ariaLabel.includes('Phone:')) {
                                        phone = ariaLabel.replace('Phone:', '').trim();
                                    }
                                });
                            }

                            // Look for address in detail panel
                            const addressButton = document.querySelector('button[data-item-id="address"]');
                            if (addressButton) {
                                // Get the full address from aria-label
                                const ariaLabel = addressButton.getAttribute('aria-label');
                                if (ariaLabel) {
                                    // Remove common prefixes in different languages
                                    address = ariaLabel
                                        .replace(/^Address:\s*/i, '')
                                        .replace(/^Adresse:\s*/i, '')
                                        .trim();
                                }
                            }

                            return { phone, address };
                        });

                        // Update business info
                        if (details.phone) {
                            businesses[i].phone = details.phone;
                        }
                        // Always use the sanitized address from detail panel if available
                        if (details.address) {
                            businesses[i].address = details.address;
                        }
                    }
                }

            } catch (error) {
                console.log(`Could not extract details for ${businesses[i].name}:`, error.message);
            }
        }

        return businesses;
    }

    removeDuplicates(businesses) {
        const seen = new Map();

        businesses.forEach(business => {
            // Create a unique key based on name and address
            const key = `${business.name?.toLowerCase()}_${business.address?.toLowerCase()}`;

            if (!seen.has(key)) {
                seen.set(key, business);
            }
        });

        return Array.from(seen.values());
    }

    async saveToJSON(data, filename = 'results.json') {
        try {
            await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`Results saved to ${filename}`);
        } catch (error) {
            console.error('Error saving to JSON:', error.message);
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }
}

// Main execution function
async function main() {
    const crawler = new GoogleMapsCrawler();

    try {
        // Get user input
        console.log('\n=== Google Maps Crawler ===\n');
        const branchName = await getUserInput('Bitte geben Sie die Branche ein (z.B. restaurants, zahnarzt, apotheke): ');
        const postalCode = await getUserInput('Bitte geben Sie die Postleitzahl ein (z.B. 44388, 10001): ');

        if (!branchName || !postalCode) {
            console.error('Fehler: Branche und Postleitzahl müssen angegeben werden!');
            return;
        }

        console.log(`\nStarte Suche nach "${branchName}" in "${postalCode}"...\n`);

        await crawler.initialize();
        const results = await crawler.searchBusinesses(branchName, postalCode);

        // Display results
        console.log('\n=== RESULTS ===');
        results.forEach((business, index) => {
            console.log(`\n${index + 1}. ${business.name}`);
            console.log(`   Address: ${business.address || 'N/A'}`);
            console.log(`   Phone: ${business.phone || 'N/A'}`);
        });

        // Save to JSON file
        await crawler.saveToJSON(results, 'google_maps_results.json');

    } catch (error) {
        console.error('Error in main execution:', error);
    } finally {
        await crawler.close();
    }
}

// Run the crawler
if (require.main === module) {
    main().catch(console.error);
}

module.exports = GoogleMapsCrawler;
