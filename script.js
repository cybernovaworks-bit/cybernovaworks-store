document.addEventListener('DOMContentLoaded', () => {
    console.log("www.CyberNovaWorks.store website loaded.");

    // --- Top Announcement Bar Close ---
    const topBar = document.getElementById('topBar');
    const topBarClose = document.getElementById('topBarClose');
    const navbar = document.getElementById('navbar');

    if (topBarClose && topBar && navbar) {
        topBarClose.addEventListener('click', () => {
            topBar.classList.add('hidden');
            navbar.classList.add('top-bar-hidden');
        });
    }

    // --- Mobile Menu Toggle ---
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinksContainer = document.querySelector('.nav-links');
    const menuIcon = mobileMenu.querySelector('i');

    mobileMenu.addEventListener('click', () => {
        navLinksContainer.classList.toggle('active-menu');
        if (navLinksContainer.classList.contains('active-menu')) {
            menuIcon.classList.remove('fa-bars');
            menuIcon.classList.add('fa-xmark');
        } else {
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');
        }
    });

    // --- Smooth Scrolling for Nav Links ---
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            if (!targetId || !targetId.startsWith('#')) {
                return;
            }

            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            navLinksContainer.classList.remove('active-menu');
            menuIcon.classList.remove('fa-xmark');
            menuIcon.classList.add('fa-bars');

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 120,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Footer Nav Smooth Scroll ---
    document.querySelectorAll('.footer-nav a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 120,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Contact Form Submission ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('Thank you for contacting www.CyberNovaWorks.store! Your message has been sent successfully.');
            this.reset();
        });
    }

    // --- Quote Form Submission ---
    const quoteForm = document.getElementById('quoteForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('Thank you! Your quote request has been submitted. We will get back to you within 24 hours.');
            this.reset();
        });
    }

    // --- Navbar Scroll Effect ---
    const navbarEl = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbarEl.classList.add('scrolled');
        } else {
            navbarEl.classList.remove('scrolled');
        }
    });

    // --- Active Nav Link on Scroll ---
    const sections = document.querySelectorAll('section[id]');
    const navLinksAll = document.querySelectorAll('.nav-links a');

    const highlightNavOnScroll = () => {
        const scrollY = window.scrollY + 120;
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinksAll.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === '#' + sectionId) {
                        link.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', highlightNavOnScroll);

    // --- Scroll Reveal Animations ---
    const revealElements = document.querySelectorAll('.reveal, .service-card, .portfolio-card, .feature-item, .testimonial-card, .blog-card');

    document.querySelectorAll('.service-card, .portfolio-card, .feature-item, .testimonial-card, .blog-card').forEach((el, index) => {
        if (!el.classList.contains('reveal')) {
            el.classList.add('reveal');
            el.style.transitionDelay = `${(index % 3) * 0.15}s`;
        }
    });

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 100;
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            if (elementTop < windowHeight - revealPoint) {
                element.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    // --- Starry Background Generation ---
    const generateStars = () => {
        const starsContainer = document.getElementById('stars-container');
        if (!starsContainer) return;

        const isMobile = window.innerWidth < 820;
        const numStars = isMobile ? 18 : 100;
        for (let i = 0; i < numStars; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            const xPos = Math.random() * 100;
            const yPos = Math.random() * 100;
            const size = Math.random() * 1.5 + 0.5;
            const duration = Math.random() * 5 + 3;
            const delay = Math.random() * 5;

            star.style.left = `${xPos}%`;
            star.style.top = `${yPos}%`;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.animationDuration = `${duration}s`;
            star.style.animationDelay = `${delay}s`;

            starsContainer.appendChild(star);
        }
    };
    generateStars();
});
