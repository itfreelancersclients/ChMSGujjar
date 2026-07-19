/* ==========================================================
   IFC AI CHAT WIDGET — PROFESSIONAL VERSION (v4)

   NEW IN THIS VERSION:
   - Real fuzzy matching (catches typos generically, e.g.
     "websit", "digtal marketing" — not just a fixed list)
   - Chat history saved in the browser (localStorage) — the
     conversation persists across pages and reloads
   - Date & time shown under every message
   - "Contact Us" and "View Portfolio" quick-action buttons
     under every bot reply
   - Expanded knowledge base (refund policy, NDA/privacy,
     Google Ads, landing pages, SEO audits, and more)

   English-only replies. Recognizes Roman Urdu greetings too,
   but always answers in English (as originally requested).

   HOW TO USE:
   1. Save this file as "ifc-chatbot.js" in your site's root
      folder (same place as index.html, style.css).
   2. On every page, add this single line just before </body>:

      <script src="ifc-chatbot.js" defer></script>

   IMPORTANT: "Contact Us" / "View Portfolio" buttons link to
   "contact.html" and "portfolio.html" assuming they live in
   the same folder as every page using this script. If your
   file names differ, update CONTACT_URL / PORTFOLIO_URL below.
========================================================== */

(function () {

  const CONTACT_URL = "contact.html";
  const PORTFOLIO_URL = "portfolio.html";
  const HISTORY_KEY = "ifc_chat_history_v1";
  const MAX_HISTORY = 40; // cap stored messages so localStorage doesn't grow unbounded

  // ================= 1. INJECT CSS =================
  const style = document.createElement('style');
  style.textContent = `
    #ifc-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #000080, #D4AF37);
      color: #fff;
      font-size: 26px;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,0.35);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }
    #ifc-chat-btn:hover { transform: scale(1.08); }

    #ifc-chat-box {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 340px;
      max-width: 92vw;
      height: 480px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
      font-family: 'Jost', Arial, sans-serif;
    }
    #ifc-chat-header {
      background: #000080;
      color: #D4AF37;
      padding: 14px 16px;
      font-weight: 600;
      font-size: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #ifc-chat-header span.ifc-sub {
      display: block;
      color: #fff;
      font-weight: 400;
      font-size: 11px;
      margin-top: 2px;
    }
    #ifc-chat-header-btns { display: flex; align-items: center; gap: 10px; }
    #ifc-chat-clear {
      cursor: pointer;
      color: #fff;
      font-size: 11px;
      background: none;
      border: 1px solid rgba(255,255,255,0.4);
      border-radius: 10px;
      padding: 2px 8px;
    }
    #ifc-chat-close {
      cursor: pointer;
      color: #fff;
      font-size: 18px;
      background: none;
      border: none;
    }
    #ifc-chat-messages {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
      background: #f7f7fb;
    }
    .ifc-msg-wrap { margin-bottom: 10px; }
    .ifc-msg {
      max-width: 82%;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 13.5px;
      line-height: 1.5;
      white-space: pre-line;
    }
    .ifc-bot {
      background: #e8eaf6;
      color: #000080;
      border-bottom-left-radius: 2px;
    }
    .ifc-user {
      background: #000080;
      color: #fff;
      margin-left: auto;
      border-bottom-right-radius: 2px;
    }
    .ifc-timestamp {
      font-size: 10px;
      color: #999;
      margin-top: 2px;
    }
    .ifc-timestamp.user { text-align: right; }
    .ifc-typing {
      background: #e8eaf6;
      color: #666;
      font-style: italic;
      max-width: 60%;
      padding: 8px 12px;
      border-radius: 10px;
      margin-bottom: 8px;
      font-size: 13px;
    }
    #ifc-chat-input-row {
      display: flex;
      border-top: 1px solid #eee;
    }
    #ifc-chat-input {
      flex: 1;
      border: none;
      padding: 10px 12px;
      font-size: 13.5px;
      outline: none;
    }
    #ifc-chat-send {
      background: #D4AF37;
      color: #000080;
      border: none;
      padding: 0 16px;
      font-weight: 600;
      cursor: pointer;
    }
    .ifc-quick-replies {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 10px;
    }
    .ifc-quick-btn {
      background: #fff;
      border: 1px solid #D4AF37;
      color: #000080;
      font-size: 12px;
      padding: 5px 10px;
      border-radius: 14px;
      cursor: pointer;
    }
    .ifc-quick-btn:hover { background: #D4AF37; color: #fff; }
    .ifc-action-row {
      display: flex;
      gap: 6px;
      margin-top: 6px;
    }
    .ifc-action-btn {
      font-size: 11px;
      color: #000080;
      background: #fff;
      border: 1px solid #000080;
      border-radius: 12px;
      padding: 4px 10px;
      text-decoration: none;
      cursor: pointer;
    }
    .ifc-action-btn:hover { background: #000080; color: #fff; }
  `;
  document.head.appendChild(style);

  // ================= 2. INJECT HTML =================
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <button id="ifc-chat-btn">💬</button>
    <div id="ifc-chat-box">
      <div id="ifc-chat-header">
        <div>
          IFC Assistant
          <span class="ifc-sub">Ask about our services, pricing, or projects</span>
        </div>
        <div id="ifc-chat-header-btns">
          <button id="ifc-chat-clear" title="Clear chat history">Clear</button>
          <button id="ifc-chat-close">✕</button>
        </div>
      </div>
      <div id="ifc-chat-messages"></div>
      <div id="ifc-chat-input-row">
        <input id="ifc-chat-input" type="text" placeholder="Type your question...">
        <button id="ifc-chat-send">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  // ================= 3. KNOWLEDGE BASE =================
  const KB = [

    // ---------- GREETINGS (English) ----------
    { keys: ["hi","hello","hey","good day"], reply: "Hello! Welcome to IT Freelancers Clients (IFC). I can tell you about our services, pricing, timelines, or how to get started. What would you like to know?" },
    { keys: ["good morning"], reply: "Good morning! How can I help you today — services, pricing, or getting started on a project?" },
    { keys: ["good afternoon"], reply: "Good afternoon! What can I help you with — our services, pricing, or starting a project?" },
    { keys: ["good evening"], reply: "Good evening! Happy to help — are you looking into a specific service or general information?" },
    { keys: ["good night"], reply: "Good night! Thank you for visiting IT Freelancers Clients. Have a wonderful evening!" },
    { keys: ["how are you"], reply: "I'm doing well, thank you! I'm here to help with any questions about our services. What can I do for you?" },
    { keys: ["thank you","thanks","thankyou","thanks a lot","thank you very much"], reply: "You're very welcome! Let me know if there's anything else you'd like to know about our services." },
    { keys: ["bye","goodbye","see you"], reply: "Thanks for stopping by! Feel free to reach out anytime through the Contact page if you have more questions." },
    { keys: ["good luck"], reply: "Thank you very much! We wish you great success with your business and projects." },
    { keys: ["who are you","what is your name","your name"], reply: "I'm the IFC Assistant — a virtual helper for IT Freelancers Clients. I can answer questions about our 10 services, pricing, timelines, and how to get started." },
    { keys: ["are you a human","are you real"], reply: "I'm an AI-powered virtual assistant designed to give quick, helpful information about our services." },
    { keys: ["who created you","who made this chatbot","who made you"], reply: "I was created to help visitors of IT Freelancers Clients quickly find information about our services and get their questions answered." },
    { keys: ["what can you do"], reply: "I can answer questions about our services, pricing, projects, portfolio, and how to get started with IFC." },
    { keys: ["tell me a joke"], reply: "Here's one for you: Why did the web developer go broke? Because they used up all their cache!" },
    { keys: ["good job","nice work","great"], reply: "Thank you! We appreciate that. Let us know if there's anything else we can help you with." },

    // ---------- GREETINGS (Roman Urdu recognized, replied in English) ----------
    { keys: ["assalam o alaikum","assalamualaikum","salam"], reply: "Hello! Welcome to IFC Assistant. I'll be happy to answer your questions in English — feel free to ask about our services, pricing, or projects." },
    { keys: ["kaise ho","kia haal hai","ap kya karte ho"], reply: "I'm doing well, thank you! I can help you in English with any questions about our services, pricing, or how to get started." },
    { keys: ["mujhe help chahiye","help chahiye"], reply: "I'm happy to help! Please tell me, in English if possible, which service or information you're looking for." },

    // ---------- COMPANY / ABOUT ----------
    { keys: ["what is ifc","about the company","about your company","tell me about ifc","about us"], reply: "IT Freelancers Clients (IFC) is a digital agency offering 10 core services — including web development, graphic design, SEO, digital marketing, and more — helping businesses grow online." },
    { keys: ["where are you located","location","based in","which country are you in"], reply: "We work remotely and serve clients internationally, so location isn't a barrier to working together. You can reach out through the Contact page regardless of where you're based." },
    { keys: ["are you available","availability","are you open"], reply: "Yes, we're currently accepting new projects. You can share your requirements through the Contact page and our team will get back to you promptly." },
    { keys: ["do you work on weekends","weekend"], reply: "Our team generally follows a standard weekly schedule, but urgent requests can often be accommodated. Feel free to mention your timeline when you reach out." },
    { keys: ["schedule a meeting","book a call","set up a call","zoom","google meet"], reply: "Absolutely — please reach out through the Contact page with your preferred time and a brief note about your project, and our team will schedule a call with you." },
    { keys: ["international clients","work with clients abroad","overseas clients","global clients","usa client","uk client","canada client","australia client","worldwide"], reply: "Yes, we regularly work with international clients — including from the USA, UK, Canada, Australia, and beyond. All communication and delivery are handled remotely and efficiently across time zones." },
    { keys: ["why choose ifc","why hire you","advantages","why should i hire you","what makes you different"], reply: "We focus on quality work, clear communication, creative solutions, and client satisfaction, backed by experience across 10 different digital services." },
    { keys: ["trust","are you professional","guarantee","safe to hire","do you guarantee results"], reply: "We believe in transparent communication and professional project handling, and we're committed to delivering high-quality work following industry best practices. Exact results can vary depending on the project and market conditions." },
    { keys: ["team","experience level","how long have you been doing this"], reply: "Our team continuously improves its skills and follows modern digital trends to provide quality, up-to-date services." },
    { keys: ["what industries do you work with","what industries do you serve"], reply: "We work with businesses across many industries, including retail, education, healthcare, technology, real estate, e-commerce, and professional services." },
    { keys: ["do you work with small businesses","do you work with large companies","small businesses and large companies"], reply: "Yes — we work with startups, small businesses, entrepreneurs, and established companies, with scalable solutions for businesses of all sizes." },
    { keys: ["is consultation free"], reply: "Yes, the initial consultation and project discussion are free. We'd be happy to learn about your project." },
    { keys: ["do you use ai","do you use artificial intelligence"], reply: "We use modern tools and technologies where appropriate to improve productivity, creativity, and project quality." },
    { keys: ["confidential","privacy","nda","is my information safe"], reply: "Yes, we respect client privacy and keep project information confidential. If required, we can also work under a Non-Disclosure Agreement (NDA)." },
    { keys: ["contract","agreement"], reply: "Project scope, timelines, and payment details are discussed and agreed upon before work begins." },

    // ---------- SERVICES OVERVIEW ----------
    { keys: ["what services do you offer","your services","our services","list of services","services you provide","what do you do","services","what do you offer","services list","services batao","menu"], reply: "We offer 10 core services:\n1. Freelancing\n2. Graphic Design\n3. Video Editing\n4. SEO\n5. Digital Marketing\n6. Affiliate Marketing\n7. Virtual Assistant\n8. E-commerce Management\n9. Communication & Soft Skills\n10. Web & App Development\n\nWhich one would you like to know more about?" },
    { keys: ["best service","recommend service","which service is best","what is the best service","what is your best service","can you recommend a service","can you help me choose a service"], reply: "The best service depends on your specific goals. Tell me a bit about what you're trying to achieve, and I can point you to the right service." },

    // ---------- FREELANCING ----------
    { keys: ["freelancing","freelance","hire a freelancer","freelancing course","remote work","online work"], reply: "Our Freelancing service connects you with skilled professionals for a wide range of tasks — from design and writing to development — on a project or ongoing basis. We can also guide beginners who want to start freelancing." },
    { keys: ["how to start freelancing","learn freelancing","become a freelancer"], reply: "We can guide you on freelancing fundamentals, portfolio building, client communication, and choosing the right digital skills to focus on." },

    // ---------- GRAPHIC DESIGN ----------
    { keys: ["graphic design","logo","design a logo","banner design","brand identity","branding","design services","poster design","business card","flyer","brochure"], reply: "Our Graphic Design service covers logos, branding, business cards, flyers, brochures, posters, banners, and social media creatives — everything you need for a professional visual identity." },
    { keys: ["can you design logos","logo design"], reply: "Yes, we create custom logos as part of our Graphic Design service, tailored to your brand's identity and industry." },
    { keys: ["can you create social media posts","social media graphics","social media creatives","do you design business cards"], reply: "Yes, designing social media posts, business cards, and other creatives is part of our Graphic Design service, matched to your brand's style." },
    { keys: ["thumbnail","youtube thumbnail","can you create youtube thumbnails"], reply: "Yes, we design attractive YouTube thumbnails focused on improving click-through rates and viewer engagement." },

    // ---------- VIDEO EDITING ----------
    { keys: ["video editing","edit videos","youtube videos","reels editing"], reply: "Yes, we offer Video Editing services including YouTube videos, Instagram Reels, TikTok videos, and promotional content — from raw footage to a polished final product, including transitions, subtitles, and color correction." },
    { keys: ["do you edit youtube videos","can you edit reels","instagram reels","facebook reels","youtube shorts","tiktok"], reply: "Yes, editing YouTube videos, Reels, Shorts, and TikTok videos is a core part of our Video Editing service, including cuts, transitions, captions, and color correction." },
    { keys: ["can you help my youtube channel"], reply: "Yes — we can help with video editing, thumbnails, branding, SEO, and digital marketing for YouTube channels." },

    // ---------- SEO ----------
    { keys: ["seo","search engine optimization","google ranking","rank on google","optimize my website for google","keyword research","seo kya hai","can you rank my website"], reply: "Our SEO service includes keyword research, on-page and technical SEO, link building, local SEO, and content optimization to help your website rank higher on Google. Exact rankings can't be guaranteed since search engines control their own algorithms, but we follow industry best practices." },
    { keys: ["seo audit","website audit"], reply: "Yes, we can review your website and recommend SEO, performance, and usability improvements." },

    // ---------- DIGITAL MARKETING ----------
    { keys: ["digital marketing","online marketing","marketing services","social media marketing","facebook ads","instagram ads","instagram marketing"], reply: "Our Digital Marketing service covers social media marketing, paid ad campaigns, content marketing, email marketing, and strategy — designed to grow your brand's reach and conversions." },
    { keys: ["google ads","advertising","ppc"], reply: "Yes, we can help plan and manage online advertising campaigns, including Google Ads, as part of our Digital Marketing services." },
    { keys: ["can you manage my social media","social media","facebook","instagram","linkedin"], reply: "Yes, we create content, schedule posts, manage campaigns, and help grow your social media presence." },
    { keys: ["blog","content writing"], reply: "We create professional, SEO-friendly content that helps improve website visibility and engage visitors." },

    // ---------- AFFILIATE MARKETING ----------
    { keys: ["affiliate marketing","what is affiliate marketing","affiliate program"], reply: "Affiliate marketing is a performance-based strategy where you earn a commission for referring customers to a product or service. We help set up and manage affiliate marketing programs and campaigns for businesses." },

    // ---------- VIRTUAL ASSISTANT ----------
    { keys: ["virtual assistant","va service","do you provide virtual assistant services","admin support","data entry","customer support","email management","appointment scheduling","i need a virtual assistant"], reply: "Yes, we provide Virtual Assistant services covering admin tasks, data entry, email management, scheduling, research, and daily business operations, so you can focus on growth." },

    // ---------- E-COMMERCE ----------
    { keys: ["e-commerce","ecommerce","e commerce","online store","shopify","woocommerce","manage my online store","build e-commerce","amazon store","can you create ecommerce website","i need an online store"], reply: "Our E-commerce Management service covers store setup (Shopify, WooCommerce), product listing, inventory management, and order processing. Yes, we also build e-commerce websites from scratch." },

    // ---------- COMMUNICATION & SOFT SKILLS ----------
    { keys: ["communication","soft skills","training service","workplace communication","communication skills","professional skills"], reply: "Our Communication & Soft Skills training covers workplace communication, feedback, confidence-building, interview preparation, and leadership skills for individuals and teams." },

    // ---------- WEB & APP DEVELOPMENT ----------
    { keys: ["web development","website development","do you create websites","build a website","app development","website design","android app","mobile app","wordpress","can you build my website","i need a website"], reply: "Yes, we build websites and web applications — including WordPress sites — from simple business sites to custom-developed platforms, as well as Android app development." },
    { keys: ["landing page"], reply: "Yes, we create high-converting landing pages for marketing campaigns and business websites." },
    { keys: ["business website","company website"], reply: "We build professional business websites that strengthen your online presence and help attract customers." },
    { keys: ["can you redesign my existing website","website redesign","redesign my site","redesign website"], reply: "Yes, we offer website redesign services — we can refresh your existing site's design, improve performance, and modernize its functionality." },
    { keys: ["responsive","mobile friendly"], reply: "Yes, all the websites we build are fully responsive and optimized for desktop, tablet, and mobile devices." },
    { keys: ["hosting","domain"], reply: "We can guide you on choosing suitable hosting and connecting a domain name for your website." },
    { keys: ["website speed","site speed","loading speed","can you improve my website"], reply: "Yes, we can improve your website's design, speed, mobile responsiveness, SEO, and overall performance." },
    { keys: ["website security"], reply: "We follow best practices to help improve your website's security and reliability." },
    { keys: ["website maintenance","maintain website"], reply: "Yes, we provide ongoing website maintenance, updates, and security improvements after launch." },

    // ---------- PRICING ----------
    { keys: ["how much do you charge","pricing","cost","price","rates","how much does it cost","how much","charges"], reply: "Pricing depends on the specific project's scope, size, and complexity. Please share your project details through the Contact page and we'll provide a tailored quote." },
    { keys: ["cheap","budget","low budget"], reply: "We offer flexible solutions for different budgets while maintaining professional quality." },
    { keys: ["do you offer monthly packages","monthly package","retainer","package","basic package","premium package","custom package"], reply: "Yes, we offer customized packages, including monthly retainer options, for ongoing services like SEO, digital marketing, and virtual assistant support." },
    { keys: ["what payment methods do you accept","payment methods","how do i pay","payment"], reply: "We accept secure online payment methods. Specific payment details will be shared once your project scope is confirmed." },
    { keys: ["free hai","free quote","get quote","quotation","request quote","want quotation","estimate"], reply: "Yes, we provide free project quotations. Please share your project requirements and we'll review them and get back to you." },
    { keys: ["refund","money back"], reply: "Refund requests are reviewed according to the agreed project terms and the stage of work completed at the time of the request." },

    // ---------- CONTACT ----------
    { keys: ["how can i contact you","contact","email us","phone number","reach you","get in touch","contact us","talk to team","contact kaise karein","how can i contact your team"], reply: "You can reach us through the Contact page on our website, where you can send project details or questions directly to our team." },
    { keys: ["how do i get started","get started","start a project","ready to start","let's start","start business","how to start my project"], reply: "Getting started is simple — just share your project details or requirements through the Contact page, and our team will follow up with next steps and a quote." },
    { keys: ["can i hire you for a long-term project","long-term project","ongoing project","can i work with you long term"], reply: "Yes, we work on both one-time projects and long-term ongoing engagements, including monthly retainers for continuous support." },
    { keys: ["urgent","fast delivery","rush project"], reply: "If you have an urgent project, let us know your deadline through the Contact page and we'll confirm whether we can meet your required timeline." },

    // ---------- LEAD COLLECTION ----------
    { keys: ["my project","project details","i need your service","my requirements","new project"], reply: "Great! To understand your project better, please share:\n- Your name\n- Required service\n- Project details\n- Budget\n- Deadline\n\nYou can send this through the Contact page." },
    { keys: ["contact me","call me","send details"], reply: "Sure — please share your name, email, and project details through the Contact page, and our team will follow up with you directly." },
    { keys: ["budget range"], reply: "Feel free to share your budget range through the Contact page, and we'll recommend a suitable package for your project." },
    { keys: ["deadline"], reply: "We always try to work within your timeline. Please share your expected deadline through the Contact page so we can plan accordingly." },
    { keys: ["can you create a custom solution","do you offer custom solutions","custom project","custom"], reply: "Yes — every project is customized according to the client's specific requirements and objectives." },

    // ---------- PORTFOLIO ----------
    { keys: ["portfolio","past work","previous projects","examples of your work","case studies","work samples","portfolio examples","can i see your portfolio"], reply: "You can view examples of our past work on the Portfolio page, covering design, development, and marketing projects across different industries." },

    // ---------- PROJECT TIMELINE / QUALITY ----------
    { keys: ["how long does a project take","project timeline","turnaround time","how long will it take","delivery","how long will my website take"], reply: "Project timelines vary based on scope and complexity. Once we understand your specific requirements, we'll provide a realistic timeline before starting work." },
    { keys: ["revision","revisions","can i request changes"], reply: "Yes, we provide revisions according to the agreed project scope to make sure the final result meets your expectations." },
    { keys: ["quality"], reply: "We focus on professional quality, creativity, accuracy, and overall client satisfaction on every project." },
    { keys: ["do you provide support after delivery","support","after support","maintenance"], reply: "Yes, we provide post-project support for eligible services, and can offer ongoing maintenance if required." },

    // ---------- BUSINESS GROWTH ----------
    { keys: ["can you help my business grow","grow my business","help me grow","i want to grow business","business growth","increase sales","how can i grow my business"], reply: "Yes — our combination of services, from digital marketing and SEO to e-commerce management and web development, is specifically designed to support business growth." },
    { keys: ["small business","new business","startup","start up","i have a new business","starting a business"], reply: "We provide affordable, tailored digital solutions for startups and small businesses — including branding, website setup, and a digital marketing strategy to build your online presence." },
    { keys: ["can i ask another question"], reply: "Of course! Feel free to ask anything related to our services, projects, or business solutions." },
    { keys: ["what platforms do you support"], reply: "We work with modern web technologies and popular business platforms based on your specific project requirements." },

  ];
  // ================= 4. FUZZY MATCHING ENGINE =================
  // Splits text into words and allows small typos (Levenshtein distance)
  // to still match, instead of relying on a fixed list of misspellings.

  function tokenize(str) {
    return str.toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[m][n];
  }

  function fuzzyWordMatch(keyWord, userTokens) {
    for (const t of userTokens) {
      if (t === keyWord) return true;
      // Allow small typos for longer words only, to avoid false positives on short words
      const allowedDistance = keyWord.length >= 7 ? 2 : (keyWord.length >= 4 ? 1 : 0);
      if (allowedDistance > 0 && Math.abs(t.length - keyWord.length) <= allowedDistance) {
        if (levenshtein(t, keyWord) <= allowedDistance) return true;
      }
    }
    return false;
  }

  function ifcFindReply(userText) {
    const userTokens = tokenize(userText);
    let bestMatch = null;
    let bestScore = 0;

    for (const item of KB) {
      let score = 0;
      for (const k of item.keys) {
        const keyWords = k.toLowerCase().split(/\s+/);
        const allMatched = keyWords.every(w => fuzzyWordMatch(w, userTokens));
        if (allMatched) score += keyWords.length;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    if (bestMatch && bestScore > 0) {
      return bestMatch.reply;
    }
    return "I'm sorry, I couldn't fully understand your question. Please rephrase it or contact our team through the Contact page for personalized assistance.";
  }

  // ================= 5. CHAT HISTORY (localStorage) =================
  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      const trimmed = history.slice(-MAX_HISTORY);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
      // localStorage unavailable or full — fail silently, chat still works this session
    }
  }

  let chatHistory = loadHistory();

  // ================= 6. CHAT UI LOGIC =================
  const ifcQuickReplies = ["Our Services", "Pricing", "Contact", "Get Started"];

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' · ' +
           d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function renderMessage(text, sender, ts, withActions) {
    const messages = document.getElementById('ifc-chat-messages');
    const wrap = document.createElement('div');
    wrap.className = 'ifc-msg-wrap';

    const div = document.createElement('div');
    div.className = 'ifc-msg ' + (sender === 'bot' ? 'ifc-bot' : 'ifc-user');
    div.textContent = text;
    wrap.appendChild(div);

    const time = document.createElement('div');
    time.className = 'ifc-timestamp' + (sender === 'user' ? ' user' : '');
    time.textContent = formatTime(ts);
    wrap.appendChild(time);

    if (sender === 'bot' && withActions) {
      const actions = document.createElement('div');
      actions.className = 'ifc-action-row';
      actions.innerHTML = `
        <a class="ifc-action-btn" href="${CONTACT_URL}">Contact Us</a>
        <a class="ifc-action-btn" href="${PORTFOLIO_URL}">View Portfolio</a>
      `;
      wrap.appendChild(actions);
    }

    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  function ifcAddMessage(text, sender, withActions) {
    const ts = Date.now();
    renderMessage(text, sender, ts, withActions);
    chatHistory.push({ text, sender, ts });
    saveHistory(chatHistory);
  }

  function ifcAddBotMessage(text) { ifcAddMessage(text, 'bot', true); }

  function ifcAddQuickReplies() {
    const messages = document.getElementById('ifc-chat-messages');
    const wrap = document.createElement('div');
    wrap.className = 'ifc-quick-replies';
    ifcQuickReplies.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'ifc-quick-btn';
      btn.textContent = q;
      btn.onclick = () => { ifcAddMessage(q, 'user', false); ifcRespond(q); };
      wrap.appendChild(btn);
    });
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  function ifcRespond(userText) {
    const messages = document.getElementById('ifc-chat-messages');
    const typing = document.createElement('div');
    typing.className = 'ifc-typing';
    typing.textContent = 'IFC Assistant is typing...';
    messages.appendChild(typing);
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
      typing.remove();
      ifcAddBotMessage(ifcFindReply(userText));
    }, 600);
  }

  function ifcSend() {
    const input = document.getElementById('ifc-chat-input');
    const text = input.value.trim();
    if (!text) return;
    ifcAddMessage(text, 'user', false);
    input.value = '';
    ifcRespond(text);

    if (typeof gtag === 'function') {
      gtag('event', 'chatbot_interaction', {
        event_category: 'IFC Assistant',
        event_label: text
      });
    }
  }

  function ifcRenderStoredHistory() {
    const messages = document.getElementById('ifc-chat-messages');
    messages.innerHTML = '';
    chatHistory.forEach(m => {
      renderMessage(m.text, m.sender, m.ts, m.sender === 'bot');
    });
  }

  function ifcClearHistory() {
    chatHistory = [];
    saveHistory(chatHistory);
    const messages = document.getElementById('ifc-chat-messages');
    messages.innerHTML = '';
    ifcAddBotMessage("Hello again! Your previous chat history has been cleared. What would you like to know?");
    ifcAddQuickReplies();
  }

  function ifcToggleChat() {
    const box = document.getElementById('ifc-chat-box');
    const isOpen = box.style.display === 'flex';
    box.style.display = isOpen ? 'none' : 'flex';

    if (!isOpen && document.getElementById('ifc-chat-messages').children.length === 0) {
      if (chatHistory.length > 0) {
        ifcRenderStoredHistory();
      } else {
        ifcAddBotMessage("Hello! Welcome to IT Freelancers Clients. I can answer questions about our 10 services, pricing, timelines, or how to get started. What would you like to know?");
        ifcAddQuickReplies();
      }
    }
  }

  // ================= 7. EVENT WIRING =================
  document.getElementById('ifc-chat-btn').addEventListener('click', ifcToggleChat);
  document.getElementById('ifc-chat-close').addEventListener('click', ifcToggleChat);
  document.getElementById('ifc-chat-send').addEventListener('click', ifcSend);
  document.getElementById('ifc-chat-clear').addEventListener('click', ifcClearHistory);
  document.getElementById('ifc-chat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') ifcSend();
  });

})();