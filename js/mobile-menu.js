// Mobile Menu Toggle Functionality - Fixed Version
(function () {
    'use strict';

    let menuToggle = null;
    let overlay = null;
    let mobileNav = null;
    let isMenuOpen = false;

    // Create mobile menu elements
    function createMobileMenu() {
        const header = document.querySelector('header');
        if (!header) return;

        const navLinks = header.querySelector('.nav-links');
        if (!navLinks) return;

        // Check if already created
        if (document.querySelector('.mobile-menu-toggle')) return;

        // Create hamburger button
        menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.type = 'button';
        menuToggle.setAttribute('aria-label', 'Toggle mobile menu');
        menuToggle.innerHTML = '<span></span><span></span><span></span>';

        // Create overlay
        overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';

        // Create mobile nav
        mobileNav = document.createElement('nav');
        mobileNav.className = 'mobile-nav';

        // Clone nav links
        const navLinksClone = navLinks.cloneNode(true);
        mobileNav.appendChild(navLinksClone);

        // Handle Theme Toggle in Mobile Menu
        const mobileThemeBtn = mobileNav.querySelector('#themeToggleBtn');
        if (mobileThemeBtn) {
            mobileThemeBtn.id = 'themeToggleBtn_mobile';

            // Register with globally exposed ThemeManager if available
            if (window.ThemeManager) {
                window.ThemeManager.registerButton(mobileThemeBtn);
            } else {
                // Fallback if ThemeManager isn't ready
                document.addEventListener('DOMContentLoaded', () => {
                    if (window.ThemeManager) window.ThemeManager.registerButton(mobileThemeBtn);
                });
            }
        }

        // Insert into DOM
        const container = header.querySelector('.container');
        container.appendChild(menuToggle);
        document.body.appendChild(overlay);
        document.body.appendChild(mobileNav);

        // Attach event listeners
        attachEventListeners();
    }

    // Open menu
    function openMenu() {
        if (isMenuOpen) return;
        isMenuOpen = true;
        menuToggle.classList.add('active');
        overlay.classList.add('active');
        mobileNav.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // Close menu
    function closeMenu() {
        if (!isMenuOpen) return;
        isMenuOpen = false;
        menuToggle.classList.remove('active');
        overlay.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Attach event listeners
    function attachEventListeners() {
        // Hamburger button click - ONLY this should open menu
        menuToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            if (isMenuOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        }, false);

        // Overlay click - close menu
        overlay.addEventListener('click', function (e) {
            e.stopPropagation();
            closeMenu();
        }, false);

        // Close when clicking links in mobile menu
        const mobileLinks = mobileNav.querySelectorAll('a, button');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function () {
                setTimeout(closeMenu, 150);
            }, false);
        });

        // Close on Escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isMenuOpen) {
                closeMenu();
            }
        });

        // Close menu on resize to desktop
        let resizeTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function () {
                if (window.innerWidth > 768 && isMenuOpen) {
                    closeMenu();
                }
            }, 250);
        });
    }

    // Initialize
    function init() {
        // Only create menu if on mobile or if screen can be mobile
        if (window.innerWidth <= 768 || 'ontouchstart' in window) {
            createMobileMenu();
        } else {
            // Create on resize if needed
            let resizeTimer;
            window.addEventListener('resize', function () {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(function () {
                    if (window.innerWidth <= 768 && !document.querySelector('.mobile-menu-toggle')) {
                        createMobileMenu();
                    }
                }, 250);
            });
        }
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
