(function () {
    'use strict';

    if (window.__cnChatbotLoaded) return;
    window.__cnChatbotLoaded = true;

    var WHATSAPP = '918092638177';
    var EMAIL = 'cybernovaworks@gmail.com';

    var CSS = [
        '.cnb-root{--cnb-blue:#00E5FF;--cnb-violet:#8A2BE2;--cnb-green:#10B981;--cnb-bg:#0f1024;--cnb-card:#1a1d36;--cnb-border:rgba(255,255,255,0.1);--cnb-text:#e6e8f5;--cnb-muted:#A0A0B0;--cnb-input:#232748;position:fixed;bottom:92px;right:22px;z-index:10000;font-family:"Open Sans","Segoe UI",Arial,sans-serif}',
        'html.theme-light .cnb-root{--cnb-bg:#f7f8fd;--cnb-card:#ffffff;--cnb-border:rgba(15,23,42,0.12);--cnb-text:#0f172a;--cnb-muted:#64748b;--cnb-input:#eef1f8}',
        '.cnb-btn{width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#007BFF,#00E5FF);color:#fff;box-shadow:0 8px 24px rgba(0,229,255,0.45);transition:transform .25s ease,box-shadow .25s ease;position:relative}',
        '.cnb-btn:hover{transform:scale(1.08);box-shadow:0 10px 30px rgba(0,229,255,0.6)}',
        '.cnb-btn svg{width:28px;height:28px}',
        '.cnb-btn .cnb-dot{position:absolute;top:2px;right:2px;width:14px;height:14px;border-radius:50%;background:#10B981;border:2px solid #0f1024}',
        '@media(max-width:600px){.cnb-root{bottom:80px;right:16px}.cnb-btn{width:52px;height:52px}}',
        '.cnb-panel{display:none;position:absolute;bottom:72px;right:0;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 180px);background:var(--cnb-card);border:1px solid var(--cnb-border);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.55);flex-direction:column}',
        '.cnb-root.open .cnb-panel{display:flex}',
        '.cnb-head{background:linear-gradient(135deg,#007BFF,#8A2BE2);color:#fff;padding:14px 16px;display:flex;align-items:center;gap:12px}',
        '.cnb-head .cnb-ava{width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,0.18);display:flex;align-items:center;justify-content:center;flex:none}',
        '.cnb-head .cnb-ava svg{width:22px;height:22px}',
        '.cnb-head .cnb-title{line-height:1.25}',
        '.cnb-head .cnb-title b{display:block;font-size:0.95rem}',
        '.cnb-head .cnb-title span{font-size:0.72rem;opacity:.9}',
        '.cnb-close{margin-left:auto;background:rgba(255,255,255,0.16);border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}',
        '.cnb-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--cnb-bg)}',
        '.cnb-msg{max-width:82%;padding:9px 13px;border-radius:14px;font-size:0.85rem;line-height:1.45;word-break:break-word;white-space:pre-wrap}',
        '.cnb-msg.bot{align-self:flex-start;background:var(--cnb-card);border:1px solid var(--cnb-border);color:var(--cnb-text);border-bottom-left-radius:4px}',
        '.cnb-msg.user{align-self:flex-end;background:linear-gradient(135deg,#007BFF,#00E5FF);color:#fff;border-bottom-right-radius:4px}',
        '.cnb-msg a{color:var(--cnb-blue);text-decoration:underline}',
        'html.theme-light .cnb-msg.user{color:#fff}',
        '.cnb-typing{display:inline-flex;gap:4px;padding:12px 14px;align-items:center}',
        '.cnb-typing i{width:6px;height:6px;border-radius:50%;background:var(--cnb-muted);animation:cnb-blink 1.2s infinite both}',
        '.cnb-typing i:nth-child(2){animation-delay:.2s}.cnb-typing i:nth-child(3){animation-delay:.4s}',
        '@keyframes cnb-blink{0%,80%,100%{opacity:.25}40%{opacity:1}}',
        '.cnb-chips{display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px 4px;background:var(--cnb-bg)}',
        '.cnb-chip{border:1px solid var(--cnb-border);background:var(--cnb-card);color:var(--cnb-text);font-size:0.76rem;padding:6px 12px;border-radius:16px;cursor:pointer;transition:all .2s ease;font-family:inherit}',
        '.cnb-chip:hover{border-color:var(--cnb-blue);color:var(--cnb-blue)}',
        '.cnb-inputbar{display:flex;gap:8px;padding:12px;border-top:1px solid var(--cnb-border);background:var(--cnb-card)}',
        '.cnb-inputbar input{flex:1;padding:11px 14px;border-radius:24px;border:1px solid var(--cnb-border);background:var(--cnb-input);color:var(--cnb-text);font-size:0.85rem;outline:none;font-family:inherit}',
        '.cnb-inputbar input:focus{border-color:var(--cnb-blue)}',
        '.cnb-inputbar button{width:42px;height:42px;border-radius:50%;border:none;cursor:pointer;background:linear-gradient(135deg,#007BFF,#00E5FF);color:#fff;font-size:16px;flex:none}',
        '@media(max-width:600px){.cnb-panel{right:0;bottom:64px}}'
    ].join('');

    var BOT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1"/><circle cx="9" cy="13" r="1"/><circle cx="15" cy="13" r="1"/><path d="M9 17h6"/></svg>';

    var TOPICS = [
        {
            id: 'web',
            k: ['website', 'web develop', 'webdesign', 'web design', 'landing page', 'business website', 'site bana'],
            r: ['Yes, we build websites! 🌐', 'Business websites start at ₹15,000 (up to 10 pages, mobile-first, contact form, SSL + hosting + domain).', 'E-commerce stores start at ₹40,000 (payments via UPI/cards, order & inventory management, admin dashboard).', 'Delivered in 2–4 weeks (e-commerce 4–8 weeks).', '→ Get a free quote: https://cybernovaworks.store/#quote']
        },
        {
            id: 'app',
            k: ['app develop', 'app development', 'mobile app', 'android', 'ios app', 'app bana', 'app banane', 'play store'],
            r: ['Yes, we develop Android & iOS apps! 📱', 'Mobile app projects start at ₹80,000 onward — MVP to production, push notifications, offline support, Play Store / App Store submission.', 'Delivery typically 8–16 weeks with weekly sprint updates on a live staging link.', '→ Get a free quote: https://cybernovaworks.store/#quote']
        },
        {
            id: 'graphic',
            k: ['graphic', 'logo', 'branding', 'poster', 'design karna', 'banner'],
            r: ['Yes! We do graphic design. 🎨', 'Logo & brand identity projects start at ₹5,000. We also make marketing collateral, posters and banners.', '→ Discuss your project: https://cybernovaworks.store/contact.html']
        },
        {
            id: 'software',
            k: ['software', 'custom software', 'software solution', 'desktop app', 'api', 'erp', 'crm'],
            r: ['Yes, we develop custom software. 💻', 'Custom software projects start at ₹1,50,000 — desktop apps, APIs, cloud-based systems, ERP/CRM style tools.', 'Every project has transparent milestones and a written scope — no hidden charges.', '→ Get a quote: https://cybernovaworks.store/#quote']
        },
        {
            id: 'pricing',
            k: ['price', 'pricing', 'cost', 'quote', 'budget', 'how much', 'rate', 'charges', 'fee', 'kitna', 'expensive'],
            r: ['Here is our pricing overview 💰', '• Business website — ₹15,000 onwards', '• E-commerce store — ₹40,000 onwards', '• Mobile app — ₹80,000 onwards', '• Graphic design — ₹5,000 onwards', '• Custom software — ₹1,50,000 onwards', 'Your exact quote is fixed after a free consultation.', '→ Get a quote: https://cybernovaworks.store/#quote']
        },
        {
            id: 'time',
            k: ['delivery', 'timeline', 'how long', 'time lagega', 'weeks', 'deadline', 'duration', 'finish', 'kitne din'],
            r: ['Here is our typical delivery time ⏱', '• Business website — 2 to 4 weeks', '• E-commerce store — 4 to 8 weeks', '• Mobile apps / software — 8 to 16 weeks', 'You get a dated schedule with your quote, and can track progress on a live staging link.']
        },
        {
            id: 'payment',
            k: ['payment', 'pay', 'upi', 'advance', 'installment', 'milestone', 'emi', 'mode'],
            r: ['Payments are milestone-based ✅', 'We work in weekly sprints with clear milestones, and give you a written scope before starting — no hidden charges. UPI, cards and bank transfer accepted.']
        },
        {
            id: 'location',
            k: ['where', 'location', 'addr', 'city', 'based', 'ramgarh', 'jharkhand', 'bihar', 'office', 'visit'],
            r: ['We are based in Ramgarh, Jharkhand 📍 and serve clients across all of Jharkhand, Bihar, all of India and overseas.', 'Work is shared on a live staging link, so distance is never an issue.']
        },
        {
            id: 'contact',
            k: ['contact', 'email', 'phone', 'call', 'number', 'reach', 'talk', 'human', 'support', 'mail'],
            r: ['You can reach us anytime 👋', '📧 Email: ' + EMAIL, '💬 WhatsApp: +91 ' + WHATSAPP, '🕘 Hours: Mon–Sat, 9:00 AM – 7:00 PM', 'We reply within 24 hours.']
        },
        {
            id: 'apps',
            k: ['download app', 'download', 'store app', 'oura', 'aura music', 'jobsync', 'deenora', 'islamic', 'music player', 'app download', 'apk'],
            r: ['You can download our apps for free from the Store 🛍', '• Deenora Islamic App — FREE', '• JobSync (jobs & work) — FREE', '• Aura Music Player — free trial', '→ Open the Store: https://cybernovaworks.store/store.html']
        },
        {
            id: 'tools',
            k: ['tool', 'pdf', 'convert', 'converter', 'free tool', 'merge pdf'],
            r: ['We have 60+ free online tools 🧰', 'PDF, Word, image, audio and video converters — 100% free, run in your browser, files never uploaded.', '→ Open Free Tools: https://cybernovaworks.store/tools/swapfile/index.html']
        },
        {
            id: 'quote',
            k: ['start', 'begin', 'hire', 'work with', 'project karna', 'get quote', 'shuru'],
            r: ['Great! Let\'s start 🚀', 'Fill the quick quote form at https://cybernovaworks.store/#quote with your name, email and budget.', 'We reply within 24 hours with a fixed quote.']
        },
        {
            id: 'about',
            k: ['who', 'about', 'company', 'team', 'what do you do', 'expert'],
            r: ['CyberNovaWorks is a full-service digital agency 💼', 'We build websites, mobile apps, graphics and custom software with modern tech — and we hand over the source code when done.']
        },
        {
            id: 'greet',
            k: ['hi', 'hello', 'hey', 'hii', 'salam', 'namaste', 'good morning', 'good evening', 'good afternoon', 'yo'],
            r: ['Hello! 👋 I\'m CyberNova Assistant.', 'Ask me about our Services 💻, Pricing 💰, Delivery time ⏱, or our free Apps 🛍 — or just type your question below!']
        }
    ];

    var FALLBACK = [
        'I\'m sorry, I didn\'t fully get that 🤔',
        'For anything else, you can WhatsApp us at +91 ' + WHATSAPP + ' or email ' + EMAIL + ' — we reply within 24 hours!'
    ];

    var QUICK = [
        { t: '💻 Website Prices', q: 'website price' },
        { t: '📱 App Development', q: 'mobile app development' },
        { t: '💰 Pricing', q: 'pricing' },
        { t: '⏱ Delivery time', q: 'delivery time' },
        { t: '📍 Office location', q: 'where is your office' },
        { t: '📞 Contact', q: 'contact details' }
    ];

    function el(tag, props) {
        var node = document.createElement(tag);
        for (var k in props) node[k] = props[k];
        return node;
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function linkify(text) {
        return escapeHtml(text).replace(/https?:\/\/[^\s]+/g, function (u) {
            return '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + u.replace(/^https?:\/\//, '') + '</a>';
        });
    }

    function matchTopic(text) {
        var lower = text.toLowerCase();
        for (var i = 0; i < TOPICS.length; i++) {
            var topic = TOPICS[i];
            for (var j = 0; j < topic.k.length; j++) {
                if (lower.indexOf(topic.k[j]) !== -1) return topic;
            }
        }
        return null;
    }

    function init() {
        if (!document.getElementById('cnb-root')) {
            var style = document.createElement('style');
            style.textContent = CSS;
            document.head.appendChild(style);

            var root = el('div', { className: 'cnb-root', id: 'cnb-root' });

            var btn = el('button', { className: 'cnb-btn', id: 'cnb-btn', type: 'button', 'aria-label': 'Open chat', innerHTML: BOT_ICON + '<span class="cnb-dot"></span>' });

            var panel = el('div', { className: 'cnb-panel', id: 'cnb-panel' });

            var head = el('div', { className: 'cnb-head', innerHTML:
                '<div class="cnb-ava">' + BOT_ICON + '</div>' +
                '<div class="cnb-title"><b>CyberNova Assistant</b><span>● Online · replies instantly</span></div>' +
                '<button type="button" class="cnb-close" aria-label="Close chat">✕</button>' });

            var msgs = el('div', { className: 'cnb-msgs', id: 'cnb-msgs' });
            var chips = el('div', { className: 'cnb-chips', id: 'cnb-chips' });
            var inputBar = el('div', { className: 'cnb-inputbar' });

            var input = el('input', { type: 'text', placeholder: 'Type your message…', autocomplete: 'off' });
            var sendBtn = el('button', { type: 'button', 'aria-label': 'Send', innerHTML: '➤' });

            inputBar.appendChild(input);
            inputBar.appendChild(sendBtn);
            panel.appendChild(head);
            panel.appendChild(chips);
            panel.appendChild(msgs);
            panel.appendChild(inputBar);
            root.appendChild(btn);
            root.appendChild(panel);
            document.body.appendChild(root);

            function scrollBottom() {
                msgs.scrollTop = msgs.scrollHeight;
            }

            function addBubble(type, html) {
                var m = el('div', { className: 'cnb-msg ' + type, innerHTML: html });
                msgs.appendChild(m);
                scrollBottom();
                return m;
            }

            function typing() {
                var m = el('div', { className: 'cnb-msg bot' });
                m.innerHTML = '<span class="cnb-typing"><i></i><i></i><i></i></span>';
                msgs.appendChild(m);
                scrollBottom();
                return m;
            }

            function botSay(replyLines, hideTyping) {
                var t = typing();
                var delay = 700 + Math.min(1300, replyLines.length * 260);
                setTimeout(function () {
                    if (!hideTyping) t.remove();
                    var html = replyLines.map(linkify).join('<br>');
                    addBubble('bot', html);
                }, delay);
            }

            function send(text) {
                text = (text || '').trim();
                if (!text) return;
                addBubble('user', escapeHtml(text));
                input.value = '';

                var topic = matchTopic(text);
                if (topic) {
                    botSay(topic.r);
                } else {
                    botSay(FALLBACK);
                }
            }

            function openPanel() {
                root.classList.add('open');
                if (!msgs.children.length) {
                    botSay([
                        'Assalamu alaikum / Hello! 👋 Welcome to CyberNovaWorks — we build websites, mobile apps, graphics & custom software.',
                        'Ask me anything (Services, Pricing, Delivery time, Contact) or tap a quick option below!'
                    ], true);
                }
                input.focus();
            }

            btn.addEventListener('click', function () {
                if (root.classList.contains('open')) {
                    root.classList.remove('open');
                } else {
                    openPanel();
                }
            });

            panel.querySelector('.cnb-close').addEventListener('click', function () {
                root.classList.remove('open');
            });

            sendBtn.addEventListener('click', function () { send(input.value); });
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') send(input.value);
            });

            QUICK.forEach(function (q) {
                var c = el('button', { className: 'cnb-chip', type: 'button', textContent: q.t });
                c.addEventListener('click', function () { send(q.q); });
                chips.appendChild(c);
            });

            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && root.classList.contains('open')) root.classList.remove('open');
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();