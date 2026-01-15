const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs').promises;
const config = require('../config/config');
const { delay } = require('./utils');

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

/**
 * Google Maps Crawler Class
 * Searches Google Maps for businesses and extracts their information
 */
class GoogleMapsCrawler {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    /**
     * Initialize the browser instance
     */
    async initialize() {
        console.log('Initializing browser...');
        this.browser = await puppeteer.launch(config.browser);
        this.page = await this.browser.newPage();
        await this.page.setUserAgent(config.userAgent);
    }

    /**
     * Search for businesses on Google Maps
     * @param {string} branchName - The type of business to search for
     * @param {string} postalCode - The postal code to search in
     * @returns {Promise<Array>} Array of business objects
     */
    async searchBusinesses(branchName, postalCode) {
        try {
            console.log(`Searching for: ${branchName} in ${postalCode}`);

            // Navigate to Google Maps
            const searchQuery = `${branchName} ${postalCode}`;
            const url = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

            await this.page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

            // Wait for page to load
            await delay(config.delays.pageLoad);

            // Handle cookie consent if present
            await this.handleCookieConsent();

            // Wait for results to load after cookie handling
            await delay(config.delays.resultsLoad);

            // Check if results exist
            const resultsExist = await this.page.$(config.selectors.feed);
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

    /**
     * Handle cookie consent dialog
     */
    async handleCookieConsent() {
        try {
            console.log('Checking for cookie consent dialog...');

            // Wait for cookie dialog to appear
            await delay(config.delays.cookieConsent);

            // Try to find and click the "Accept all" button
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
                await delay(config.delays.afterCookieAccept);
            } else {
                console.log('No cookie consent dialog found or already accepted');
            }
        } catch (error) {
            console.log('Cookie handling completed:', error.message);
        }
    }

    /**
     * Scroll through results to load all listings
     */
    async scrollResults() {
        console.log('Scrolling through results...');

        try {
            let previousHeight = 0;
            let scrollAttempts = 0;

            while (scrollAttempts < config.scroll.maxAttempts) {
                // Scroll the results panel
                const currentHeight = await this.page.evaluate((selector) => {
                    const scrollableDiv = document.querySelector(selector);
                    if (scrollableDiv) {
                        scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
                        return scrollableDiv.scrollHeight;
                    }
                    return 0;
                }, config.scroll.selector);

                // Wait for new content to load
                await delay(config.delays.scrollWait);

                // Check if we've reached the end
                if (currentHeight === previousHeight) {
                    console.log('Reached end of results');
                    break;
                }

                previousHeight = currentHeight;
                scrollAttempts++;
                console.log(`Scroll attempt ${scrollAttempts}/${config.scroll.maxAttempts}`);
            }
        } catch (error) {
            console.log('Scrolling completed with minor issues:', error.message);
        }
    }

    /**
     * Extract business data from the page
     * @returns {Promise<Array>} Array of business objects
     */
    async extractBusinessData() {
        console.log('Extracting business data...');

        // Debug: Check what's on the page
        const debugInfo = await this.page.evaluate((selectors) => {
            const feed = document.querySelector(selectors.feed);
            if (!feed) return { hasFeed: false };

            const allLinks = feed.querySelectorAll('a');
            return {
                hasFeed: true,
                totalLinks: allLinks.length,
                feedHTML: feed.innerHTML.substring(0, 500) // First 500 chars for debugging
            };
        }, config.selectors);

        console.log('Debug info:', debugInfo);

        const businesses = await this.page.evaluate((selectors) => {
            const results = [];

            // Find all article elements (each represents a business listing)
            const articles = document.querySelectorAll(selectors.articles);

            console.log('Found articles:', articles.length);

            articles.forEach((article) => {
                try {
                    // Get the main link element
                    const link = article.querySelector(selectors.businessLink);
                    if (!link) return;

                    // Extract company name from aria-label
                    const ariaLabel = article.getAttribute('aria-label') || link.getAttribute('aria-label');
                    const name = ariaLabel ? ariaLabel.trim() : null;

                    // Skip if no name found
                    if (!name) return;

                    // Try to extract address from the article
                    let address = null;

                    // Look for address in various possible locations
                    const addressElements = article.querySelectorAll(selectors.addressElements);
                    addressElements.forEach(el => {
                        const text = el.textContent.trim();
                        // Check if it looks like an address (contains numbers or common address keywords)
                        if (text.match(/\d+/) || text.includes('Straße') || text.includes('Str.') || text.includes('Weg') || text.includes('Platz')) {
                            if (!address || text.length > address.length) {
                                address = text;
                            }
                        }
                    });

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
        }, config.selectors);

        // Second pass: click on each listing to get phone number and complete address
        console.log(`Extracting detailed info for ${businesses.length} businesses...`);

        for (let i = 0; i < businesses.length; i++) {
            try {
                console.log(`Processing business ${i + 1}/${businesses.length}: ${businesses[i].name}`);

                // Click on the listing using the article elements
                const articles = await this.page.$$(config.selectors.articles);
                if (articles[i]) {
                    const link = await articles[i].$(config.selectors.businessLink);
                    if (link) {
                        await link.click();
                        await delay(config.delays.businessClick);

                        // Extract phone number and address from detail panel
                        const details = await this.page.evaluate((selectors) => {
                            let phone = null;
                            let address = null;

                            // Look for phone number
                            const phoneButtons = document.querySelectorAll(selectors.phoneButton);
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
                            const addressButton = document.querySelector(selectors.addressButton);
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
                        }, config.selectors);

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

    /**
     * Remove duplicate businesses based on name and address
     * @param {Array} businesses - Array of business objects
     * @returns {Array} Array of unique business objects
     */
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

    /**
     * Save results to JSON file
     * @param {Array} data - Array of business objects
     * @param {string} filename - Output filename
     */
    async saveToJSON(data, filename = config.output.defaultFilename) {
        try {
            await fs.writeFile(
                filename,
                JSON.stringify(data, null, config.output.indent),
                'utf-8'
            );
            console.log(`Results saved to ${filename}`);
        } catch (error) {
            console.error('Error saving to JSON:', error.message);
        }
    }

    /**
     * Close the browser instance
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('Browser closed');
        }
    }
}

module.exports = GoogleMapsCrawler;
