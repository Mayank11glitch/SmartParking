// Mobile Menu Toggle Functionality
(function () {
    'use strict';

    // Create mobile menu elements if they don't exist
    function initMobileMenu() {
        const header = document.querySelector('header');
        if (!header) return;

        const navLinks = header.querySelector('.nav-links');
        if (!navLinks) return;

        // Check if mobile menu already exists
        if (document.querySelector('.mobile-menu-toggle')) return;

        // Create hamburger menu button
        const menuToggle = document.createElement('button');
        menuToggle.className = 'mobile-menu-toggle';
        menuToggle.setAttribute('aria-label', 'Toggle mobile menu');
        menuToggle.setAttribute('type', 'button'); // Prevent form submission
        menuToggle.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';

        // Create mobile nav
        const mobileNav = document.createElement('nav');
        mobileNav.className = 'mobile-nav';

        // Clone nav links to mobile menu
        const navLinksClone = navLinks.cloneNode(true);
        mobileNav.appendChild(navLinksClone);

        // Insert elements
        const container = header.querySelector('.container');
        container.appendChild(menuToggle);
        document.body.appendChild(overlay);
        document.body.appendChild(mobileNav);

        // Toggle menu function
        function toggleMenu() {
            const isActive = menuToggle.classList.contains('active');

            if (isActive) {
                menuToggle.classList.remove('active');
                overlay.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                menuToggle.classList.add('active');
                overlay.classList.add('active');
                mobileNav.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        // Event listeners - with proper event handling
        menuToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            toggleMenu();
        }, true);

        overlay.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleMenu();
        }, true);

        // Close menu when clicking on a link inside mobile nav
        const mobileLinks = mobileNav.querySelectorAll('a, .btn');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                // Don't prevent default - let the link work
                setTimeout(toggleMenu, 100);
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menuToggle.classList.contains('active')) {
                toggleMenu();
            }
        });

        // Close menu on window resize if open
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768 && menuToggle.classList.contains('active')) {
                    toggleMenu();
                }
            }, 250);
        });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }
})();
