const ThemeManager = {
    buttons: [],

    init() {
        // Expose globally
        window.ThemeManager = this;

        // Check local storage or system preference
        const storedTheme = localStorage.getItem('sp_theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        let theme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
        if (!storedTheme) theme = 'dark'; // Default preference

        this.applyTheme(theme);

        // Register the main desktop button if it exists
        const mainBtn = document.getElementById('themeToggleBtn');
        if (mainBtn) this.registerButton(mainBtn);
    },

    registerButton(btn) {
        if (!btn) return;
        // Avoid duplicates
        if (this.buttons.includes(btn)) return;

        this.buttons.push(btn);

        // Set initial icon
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        this.updateButtonIcon(btn, currentTheme);

        // Attach listener
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });
    },

    toggle() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        this.applyTheme(newTheme);
        localStorage.setItem('sp_theme', newTheme);

        // Update all registered buttons
        this.buttons.forEach(btn => this.updateButtonIcon(btn, newTheme));
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    },

    updateButtonIcon(btn, theme) {
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
});
