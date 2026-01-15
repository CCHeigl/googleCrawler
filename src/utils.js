const readline = require('readline');

/**
 * Helper function to create a delay/wait
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the specified time
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper function to get user input from terminal
 * @param {string} question - The question to ask the user
 * @returns {Promise<string>} Promise that resolves with the user's input
 */
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

/**
 * Validate German postal code format
 * @param {string} postalCode - The postal code to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidGermanPostalCode(postalCode) {
    // German postal codes are 5 digits
    return /^\d{5}$/.test(postalCode);
}

/**
 * Validate branch name (business type)
 * @param {string} branchName - The branch name to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidBranchName(branchName) {
    // Branch name should not be empty and should have reasonable length
    return branchName && branchName.length > 0 && branchName.length <= 100;
}

module.exports = {
    delay,
    getUserInput,
    isValidGermanPostalCode,
    isValidBranchName
};
