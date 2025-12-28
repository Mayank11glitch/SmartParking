/**
 * Shared initialization for Flickering Grid
 */
window.addEventListener('load', () => {
    // Check if we are on a page that needs specific loader handling (like index.html)
    // If the loader exists and hasn't been handled, we can handle it here or let page-specific scripts do it.
    // To avoid conflicts, we'll check if the grid is already initialized or if we just need to init it.

    // Using a timeout to ensure it runs after other load scripts if needed, but 'load' is usually late enough.

    // Init Flickering Grid if the canvas exists
    if (document.getElementById('flickering-grid')) {
        FlickeringGrid.init('flickering-grid', {
            color: 'rgb(255, 255, 255)',
            maxOpacity: 0.15,
            flickerChance: 0.3
        });
    }
});
