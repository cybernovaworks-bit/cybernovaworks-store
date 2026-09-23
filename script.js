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
                e.preventDefault();
                e.stopPropagation();
                window.location.href = targetId;
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
    }, true);

    // --- Footer Nav Smooth Scroll ---
    document.querySelectorAll('.footer-nav a').forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            if (!targetId || !targetId.startsWith('#')) {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = targetId;
                return;
            }

            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 120,
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Contact Form Submission (handled by FormSubmit, no JS interception needed) ---

    // --- Quote Form Submission (handled by FormSubmit, no JS interception needed) ---

    // --- Navbar Scroll Effect ---
    const navbarEl = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbarEl.classList.add('scrolled');
        } else {
            navbarEl.classList.remove('scrolled');
        }
    });

    // --- Active Nav Link on Scroll (same-page anchor highlighting only) ---
    const anchorSections = Array.from(document.querySelectorAll('section[id]'));
    const navLinksAll = document.querySelectorAll('.nav-links a');

    const highlightNavOnScroll = () => {
        const scrollY = window.scrollY + 120;
        let currentId = null;

        for (const section of anchorSections) {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                currentId = '#' + section.getAttribute('id');
                break;
            }
        }

        // At the very bottom, prefer the last anchor section on the page
        if (!currentId) {
            const last = anchorSections[anchorSections.length - 1];
            if (last && scrollY >= last.offsetTop) {
                currentId = '#' + last.getAttribute('id');
            }
        }

        navLinksAll.forEach(link => {
            if (!link.getAttribute('href') || !link.getAttribute('href').startsWith('#')) return;
            link.classList.toggle('active', link.getAttribute('href') === currentId);
        });
    };

    window.addEventListener('scroll', highlightNavOnScroll);
    window.addEventListener('load', highlightNavOnScroll);
    highlightNavOnScroll();

    // --- Scroll Reveal Animations ---
    const revealElements = document.querySelectorAll('.reveal, .service-card, .portfolio-card, .feature-item, .testimonial-card');

    document.querySelectorAll('.service-card, .portfolio-card, .feature-item, .testimonial-card').forEach((el, index) => {
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

    // --- FAQ Accordion ---
    const faqItems = document.querySelectorAll('.faq-accordion-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-accordion-q');
        const answer = item.querySelector('.faq-accordion-a');
        if (!question || !answer) return;

        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            faqItems.forEach(other => {
                other.classList.remove('open');
                const otherAnswer = other.querySelector('.faq-accordion-a');
                const otherQ = other.querySelector('.faq-accordion-q');
                if (otherAnswer) otherAnswer.style.maxHeight = null;
                if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
            });

            if (!isOpen) {
                item.classList.add('open');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                question.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // --- Theme Toggle ---
    const themeToggleBtn = document.getElementById('themeToggle');
    const setThemeIcon = () => {
        if (!themeToggleBtn) return;
        const isLight = document.documentElement.classList.contains('theme-light');
        themeToggleBtn.innerHTML = isLight
            ? '<i class="fa-solid fa-moon"></i>'
            : '<i class="fa-solid fa-sun"></i>';
    };
    setThemeIcon();
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isLight = document.documentElement.classList.toggle('theme-light');
            try { localStorage.setItem('cn-theme', isLight ? 'light' : 'dark'); } catch (e) {}
            setThemeIcon();
        });
    }
});

(function () {
    const CSS_ID = 'cnb-styles';
    if (document.getElementById(CSS_ID)) return;

    const css = `
#cnb-chat{font-family:'Open Sans',Arial,sans-serif;position:fixed;bottom:0;left:0;z-index:99999;}
#cnb-chat *{box-sizing:border-box;margin:0;padding:0;}
.cnb-launcher{position:fixed;bottom:22px;left:22px;width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:26px;color:#fff;background:linear-gradient(135deg,#6d5efc,#3e63f0);box-shadow:0 6px 20px rgba(61,99,240,.45);transition:transform .25s ease,box-shadow .25s ease;}
.cnb-launcher:hover{transform:scale(1.1);box-shadow:0 8px 26px rgba(61,99,240,.6);}
.cnb-launcher::before{content:"";position:absolute;inset:0;border-radius:50%;background:rgba(61,99,240,.4);z-index:-1;animation:cnb-pulse 2s infinite;}
@keyframes cnb-pulse{0%{transform:scale(1);opacity:1;}100%{transform:scale(1.7);opacity:0;}}
.cnb-launcher .cnb-badge{position:absolute;top:-2px;right:-2px;min-width:20px;height:20px;border-radius:10px;background:#ff4757;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;padding:0 5px;border:2px solid #0b1020;}
.cnb-panel{position:fixed;bottom:94px;left:22px;width:360px;max-width:calc(100vw - 24px);height:520px;max-height:calc(100vh - 140px);background:#0d1526;border:1px solid rgba(109,94,252,.35);border-radius:16px;overflow:hidden;display:none;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.55);}
.theme-light #cnb-chat .cnb-panel{background:#ffffff;border-color:rgba(109,94,252,.35);box-shadow:0 20px 60px rgba(0,0,0,.25);}
#cnb-chat.cnb-open .cnb-panel{display:flex;}
.cnb-header{background:linear-gradient(135deg,#6d5efc,#3e63f0);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:12px;}
.cnb-avatar{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;}
.cnb-titles{flex:1;min-width:0;}
.cnb-title{font-weight:700;font-size:15px;line-height:1.2;}
.cnb-sub{font-size:12px;opacity:.85;}
.cnb-close{width:32px;height:32px;border:none;border-radius:50%;background:rgba(255,255,255,.15);color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.cnb-close:hover{background:rgba(255,255,255,.3);}
.cnb-messages{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:10px;scrollbar-width:thin;}
.cnb-msg{max-width:82%;padding:9px 13px;border-radius:14px;font-size:13.5px;line-height:1.5;word-wrap:break-word;white-space:pre-wrap;}
.cnb-msg.bot{align-self:flex-start;background:rgba(109,94,252,.12);color:#e6ecff;border-bottom-left-radius:4px;}
.theme-light #cnb-chat .cnb-msg.bot{background:#f1f0ff;color:#1a1f36;}
.cnb-msg.user{align-self:flex-end;background:linear-gradient(135deg,#6d5efc,#3e63f0);color:#fff;border-bottom-right-radius:4px;}
.cnb-chips{padding:0 14px 10px;display:flex;flex-wrap:wrap;gap:8px;}
.cnb-chip{border:1px solid rgba(109,94,252,.5);background:rgba(109,94,252,.08);color:#a89bff;font-size:12.5px;padding:6px 12px;border-radius:18px;cursor:pointer;transition:background .2s;}
.theme-light #cnb-chat .cnb-chip{color:#4b3ff0;border-color:rgba(109,94,252,.45);background:rgba(109,94,252,.06);}
.cnb-chip:hover{background:rgba(109,94,252,.22);}
.cnb-inputbar{display:flex;gap:8px;padding:10px 12px 12px;border-top:1px solid rgba(255,255,255,.08);}
.theme-light #cnb-chat .cnb-inputbar{border-top:1px solid #e3e6ef;}
.cnb-inputbar input{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);color:#e6ecff;border-radius:22px;padding:10px 16px;font-size:13.5px;outline:none;}
.theme-light #cnb-chat .cnb-inputbar input{background:#f4f5fa;border-color:#dfe3ee;color:#1a1f36;}
.cnb-inputbar input::placeholder{color:rgba(230,236,255,.5);}
.theme-light #cnb-chat .cnb-inputbar input::placeholder{color:#9aa0b5;}
.cnb-inputbar button{width:42px;height:42px;border:none;border-radius:50%;background:linear-gradient(135deg,#6d5efc,#3e63f0);color:#fff;font-size:15px;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.cnb-inputbar button:hover{opacity:.9;}
.cnb-typing{align-self:flex-start;display:inline-flex;gap:4px;padding:11px 14px;background:rgba(109,94,252,.12);border-radius:14px;border-bottom-left-radius:4px;}
.theme-light #cnb-chat .cnb-typing{background:#f1f0ff;}
.cnb-typing span{width:7px;height:7px;border-radius:50%;background:#a89bff;animation:cnb-blink 1.2s infinite;}
.cnb-typing span:nth-child(2){animation-delay:.2s;}
.cnb-typing span:nth-child(3){animation-delay:.4s;}
@keyframes cnb-blink{0%,80%,100%{opacity:.25;}40%{opacity:1;}}
@media(max-width:600px){
  .cnb-launcher{bottom:16px;left:16px;width:52px;height:52px;font-size:23px;}
  .cnb-panel{bottom:80px;left:16px;right:16px;width:auto;height:min(520px,calc(100vh - 96px));}
}
`;

    const styleEl = document.createElement('style');
    styleEl.id = CSS_ID;
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    const KB = {
        services: {
            keys: ['service', 'services', 'offer', 'provide', 'what do you do', 'can you help'],
            reply: 'Hum in services mein kaam karte hain:\n\n\ud83d\udcbb Web Development (business sites, e-commerce)\n\ud83d\udcf1 App Development (Android / iOS)\n\ud83c\udfa8 Graphic Design (logos, branding)\n\ud83d\udee0\ufe0f Software Solutions (custom software, APIs)\n\nKis service mein interest hai?'
        },
        web: {
            keys: ['website', 'web', 'landing page', 'business site', 'ecommerce', 'e-commerce', 'shop', 'store online'],
            reply: 'Web Development: business websites \u20b915,000 onwards, e-commerce stores \u20b940,000 onwards. Mobile-first, SEO-friendly, source code handover ke saath. Detailed price ke liye bolen.'
        },
        app: {
            keys: ['app', 'mobile app', 'android', 'ios'],
            reply: 'App Development: Android / iOS apps \u20b980,000 onwards. Push notifications, offline support, Play Store / App Store submission sab included. Kya apka app idea hai?'
        },
        graphic: {
            keys: ['logo', 'graphic', 'branding', 'poster', 'banner'],
            reply: 'Graphic Design projects \u20b95,000 onwards — logos, branding, marketing materials. Brand story bataye, hum design sample bana denge.'
        },
        software: {
            keys: ['software', 'api', 'system', 'crm', 'erp', 'automation'],
            reply: 'Custom software solutions \u20b91,50,000 onwards — desktop apps, APIs, cloud systems, automation. Apki requirement kya hai?'
        },
        pricing: {
            keys: ['price', 'pricing', 'cost', 'rate', 'charge', 'kitna', 'major', 'budget', 'keemat'],
            reply: 'Starting prices:\n\n\ud83c\udf10 Business Website: \u20b915,000+\n\ud83d\udecd\ufe0f E-Commerce Store: \u20b940,000+\n\ud83d\udcf1 Mobile App: \u20b980,000+\n\ud83c\udfa8 Graphic Design: \u20b95,000+\n\ud83d\udee0\ufe0f Custom Software: \u20b91,50,000+\n\nExact quote free consultation ke baad fixed hota hai.'
        },
        time: {
            keys: ['time', 'how long', 'duration', 'weeks', 'days', 'kab tak', 'kitna time'],
            reply: 'Timelines:\n- Business website: 2-4 weeks\n- E-commerce: 4-8 weeks\n- Mobile apps / custom software: 8-16 weeks (scope ke hisaab se)\n\nShuru hone se pehle ek dated schedule milta hai.'
        },
        host: {
            keys: ['hosting', 'domain', 'ssl', 'email setup', 'maintenance', 'seo', 'support'],
            reply: 'Ha, hum hosting, SSL, domain aur business email setup krte hain. Har site on-page SEO ke saath launch hota hai. Monthly maintenance plans bhi available hain (updates, backups, security).'
        },
        quote: {
            keys: ['quote', 'estimate', 'project', 'start', 'hire', 'work'],
            reply: 'Quote lene ke liye homepage ke "Get a Quote" form mein details bharein, ya mujhe likhein. Hum 24 ghante ke andar reply karte hain. Ya WhatsApp pe bhi baat kar sakte hain!'
        },
        contact: {
            keys: ['contact', 'email', 'phone', 'number', 'call', 'whatsapp', 'reach', 'address', 'location'],
            reply: 'Contact details:\n\n\ud83d\udce7 cybernovaworks@gmail.com\n\ud83d\udcde +91 80926 38177 (WhatsApp)\n\ud83d\udccd Ramgarh, Jharkhand (pura India + overseas)\n\nTiming: Mon-Sat, 9 AM - 7 PM'
        },
        tools: {
            keys: ['tool', 'convert', 'converter', 'pdf', 'free'],
            reply: 'Humein 60+ free tools hain — PDF/Word/Image/Audio/Video converters, compressors aur bahut kuch. Naav thorbe se dekhein: Tools menu mein. Bilkul free aur browser mein hi chalta hai!'
        },
        portfolio: {
            keys: ['portfolio', 'work', 'project', 'example', 'sample', 'client'],
            reply: 'Humne e-commerce websites, branding projects aur fitness tracking mobile app jaisi cheezein banayi hain. Portfolio section mein examples dekhein, aur apne project ki details bhi batayen!'
        },
        human: {
            keys: ['human', 'agent', 'person', 'real person', 'talk'],
            reply: 'Mujhe humare team se connect kar dete hain! WhatsApp pe +91 80926 38177 pe message karein ya email karein cybernovaworks@gmail.com — hum 24 ghante mein reply karenge.'
        },
        hi: {
            keys: ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good afternoon', 'good evening'],
            reply: 'Namaste! \ud83d\udc4b CyberNovaWorks Assist mein aapka swagat hai. Main aapki services, pricing, timeline ya kisi bhi sawaal ke jawab mein madad kar sakta hoon. Bataiye, kya jaanna chahenge?'
        },
        thanks: {
            keys: ['thank', 'thanks', 'dhanyawad', 'shukriya'],
            reply: 'Aapka swagat hai! \ud83d\ude4f Aur kisi cheez ki zaroorat ho toh bataiye. Shubh din!'
        }
    };

    const chipSet = [
        'Services', 'Pricing', 'Web Development', 'Mobile App', 'Timeline', 'Contact'
    ];

    const buildReply = function (text) {
        const t = text.toLowerCase();
        const scores = [];
        for (const key in KB) {
            let score = 0;
            KB[key].keys.forEach(function (k) {
                if (t.indexOf(k) !== -1) score++;
            });
            if (score > 0) scores.push({ key: key, score: score });
        }
        if (!scores.length) return null;
        scores.sort(function (a, b) { return b.score - a.score; });
        if (scores[0].score === 0) return null;
        return KB[scores[0].key].reply;
    };

    const wrap = document.createElement('div');
    wrap.id = 'cnb-chat';
    wrap.innerHTML =
        '<button class="cnb-launcher" id="cnbLauncher" aria-label="Open chat"><i class="fa-solid fa-comments"></i><span class="cnb-badge">1</span></button>' +
        '<div class="cnb-panel">' +
            '<div class="cnb-header">' +
                '<div class="cnb-avatar"><i class="fa-solid fa-robot"></i></div>' +
                '<div class="cnb-titles"><div class="cnb-title">CyberNova Assist</div><div class="cnb-sub">Online \u00b7 replies instantly</div></div>' +
                '<button class="cnb-close" id="cnbClose" aria-label="Close chat"><i class="fa-solid fa-xmark"></i></button>' +
            '</div>' +
            '<div class="cnb-messages" id="cnbMessages"></div>' +
            '<div class="cnb-chips" id="cnbChips"></div>' +
            '<div class="cnb-inputbar">' +
                '<input id="cnbInput" type="text" placeholder="Type your message..." autocomplete="off">' +
                '<button id="cnbSend" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(wrap);

    const launcher = document.getElementById('cnbLauncher');
    const panel = wrap.querySelector('.cnb-panel');
    const closeBtn = document.getElementById('cnbClose');
    const messages = document.getElementById('cnbMessages');
    const chips = document.getElementById('cnbChips');
    const input = document.getElementById('cnbInput');
    const sendBtn = document.getElementById('cnbSend');
    const badge = launcher.querySelector('.cnb-badge');

    let opened = false;
    let greeted = false;

    const scrollBottom = function () {
        messages.scrollTop = messages.scrollHeight;
    };

    const addMsg = function (who, text, delay) {
        const div = document.createElement('div');
        div.className = 'cnb-msg ' + who;
        div.textContent = text;
        messages.appendChild(div);
        setTimeout(scrollBottom, delay || 0);
        return div;
    };

    const renderChips = function () {
        chips.innerHTML = '';
        chipSet.forEach(function (c) {
            const b = document.createElement('button');
            b.className = 'cnb-chip';
            b.type = 'button';
            b.textContent = c;
            b.addEventListener('click', function () { sendMessage(c); });
            chips.appendChild(b);
        });
    };

    const showTyping = function () {
        const t = document.createElement('div');
        t.className = 'cnb-typing';
        t.innerHTML = '<span></span><span></span><span></span>';
        messages.appendChild(t);
        scrollBottom();
        return t;
    };

    const respond = function (text) {
        const typing = showTyping();
        const delay = 550 + Math.random() * 500;
        setTimeout(function () {
            typing.remove();
            const reply = buildReply(text) ||
                'Is baare mein mujhe sure nahi hai \ud83e\udd14 Lekin main madad kar sakta hoon! Pricing ke liye "pricing", services ke liye "services", ya contact ke liye "contact" likhein. Ya WhatsApp pe humari team se baat karein: +91 80926 38177.';
            addMsg('bot', reply, 0);
        }, delay);
    };

    const sendMessage = function (text) {
        const t = (text || '').trim();
        if (!t) return;
        addMsg('user', t);
        input.value = '';
        renderChips();
        respond(t);
    };

    const openChat = function () {
        wrap.classList.add('cnb-open');
        opened = true;
        badge.style.display = 'none';
        renderChips();
        if (!greeted) {
            greeted = true;
            setTimeout(function () {
                addMsg('bot', 'Namaste! \ud83d\udc4b Main CyberNovaWorks ka assistant hoon. Website, app, logo ya software — kisi bhi project ke liye guide kar sakta hoon. Bataiye kya jaanna chahenge?', 0);
            }, 350);
        }
        input.focus();
    };

    const closeChat = function () {
        wrap.classList.remove('cnb-open');
        opened = false;
    };

    launcher.addEventListener('click', openChat);
    closeBtn.addEventListener('click', closeChat);
    sendBtn.addEventListener('click', function () { sendMessage(input.value); });
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') sendMessage(input.value);
    });
})();
