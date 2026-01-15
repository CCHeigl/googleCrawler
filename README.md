# Google Maps Crawler

A Node.js crawler that searches Google Maps for businesses based on branch name and postal code, extracting company names, addresses, and phone numbers.

## Features

- Searches Google Maps for businesses matching specified criteria
- Extracts distinct business entries with:
  - Company name
  - Full address
  - Phone number
- Removes duplicate entries automatically
- Runs in visible browser mode for transparency
- Exports results to JSON format
- Uses stealth mode to avoid bot detection

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

This will install:
- `puppeteer` - Browser automation
- `puppeteer-extra` - Enhanced Puppeteer functionality
- `puppeteer-extra-plugin-stealth` - Stealth mode to avoid detection

## Usage

### Basic Usage

1. Open `index.js` and modify the search parameters in the `main()` function:

```javascript
const branchName = 'restaurants'; // Change to your business type
const postalCode = '10001';       // Change to your postal code
```

2. Run the crawler:
```bash
npm start
```

### Customizing Search Parameters

**Branch Name Examples:**
- `'restaurants'`
- `'dentist'`
- `'plumber'`
- `'coffee shop'`
- `'hair salon'`
- `'auto repair'`

**Postal Code Examples:**
- `'10001'` (New York)
- `'90210'` (Beverly Hills)
- `'60601'` (Chicago)

### Output

The crawler will:
1. Open a visible Chrome browser window
2. Navigate to Google Maps
3. Search for the specified business type and location
4. Scroll through all results
5. Extract business information
6. Display results in the console
7. Save results to `google_maps_results.json`

### Example Output (JSON)

```json
[
  {
    "name": "Joe's Pizza",
    "address": "123 Main St, New York, NY 10001",
    "phone": "+1 212-555-0123"
  },
  {
    "name": "Best Restaurant",
    "address": "456 Broadway, New York, NY 10001",
    "phone": "+1 212-555-0456"
  }
]
```

## Configuration Options

You can modify the crawler behavior in `index.js`:

### Browser Settings
```javascript
this.browser = await puppeteer.launch({
  headless: false,  // Set to true for invisible mode
  defaultViewport: null,
  args: [
    '--start-maximized',
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
});
```

### Scroll Settings
```javascript
const maxScrollAttempts = 10; // Increase for more results
```

### Timeout Settings
```javascript
await this.page.waitForTimeout(2000); // Adjust delay between actions
```

## Programmatic Usage

You can also use the crawler as a module:

```javascript
const GoogleMapsCrawler = require('./index.js');

async function customSearch() {
  const crawler = new GoogleMapsCrawler();
  
  try {
    await crawler.initialize();
    const results = await crawler.searchBusinesses('pizza', '10001');
    await crawler.saveToJSON(results, 'my_results.json');
  } finally {
    await crawler.close();
  }
}

customSearch();
```

## Troubleshooting

### No results found
- Verify the postal code is valid
- Try a more general branch name
- Check your internet connection

### Browser doesn't open
- Ensure Puppeteer is properly installed
- Try running: `npm install puppeteer --force`

### Missing phone numbers or addresses
- Some businesses may not have complete information on Google Maps
- The crawler will mark missing data as `null` or `'N/A'`

### Rate limiting
- Add longer delays between requests
- Reduce the number of scroll attempts
- Run the crawler during off-peak hours

## Notes

- The crawler respects Google's robots.txt and uses reasonable delays
- Results depend on what's publicly available on Google Maps
- Some businesses may have incomplete information
- Duplicate entries are automatically removed based on name and address

## License

ISC
