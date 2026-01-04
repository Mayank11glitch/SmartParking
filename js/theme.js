/**
 * Theme Manager for Smart Parking
 * Handles toggling between Dark and Light modes.
 */

const ThemeManager = {
    init() {
        // Check local storage or system preference
        const storedTheme = localStorage.getItem('sp_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        let theme = storedTheme || (systemPrefersDark ? 'dark' : 'light');

        // Force default to dark if no preference (as per original design)
        if (!storedTheme) theme = 'dark';

        this.applyTheme(theme);
        this.updateButtonIcon(theme);
    },

    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        this.applyTheme(newTheme);
        this.updateButtonIcon(newTheme);
        localStorage.setItem('sp_theme', newTheme);
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    },

    updateButtonIcon(theme) {
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;

        // Simple Sun/Moon icons
        const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2"/><path d="M12 21v2"/><path d="M4.22 4.22l1.42 1.42"/><path d="M18.36 18.36l1.42 1.42"/><path d="M1 12h2"/><path d="M21 12h2"/><path d="M4.22 19.78l1.42-1.42"/><path d="M18.36 5.64l1.42-1.42"/></svg>`;
        const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

        btn.innerHTML = theme === 'dark' ? sunIcon : moonIcon;
        btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();

    // Attach listener if button exists
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.addEventListener('click', () => ThemeManager.toggle());
    }
});
