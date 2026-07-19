/* ==========================================================
   IFC AI CHAT WIDGET — PROFESSIONAL VERSION (v2)
   English-only conversational assistant covering all 10 services,
   pricing, contact, portfolio, timelines, payments, and general
   business questions with a graceful fallback for unmatched queries.

   HOW TO USE:
   1. Save this file as "ifc-chatbot.js" in your site's root folder
      (same place as index.html, style.css).
   2. On every page, add this single line just before </body>:

      <script src="ifc-chatbot.js"></script>

   That's it — no other code needs to be pasted anywhere.
========================================================== */

(function () {

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
      height: 460px;
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
    .ifc-msg {
      max-width: 82%;
      padding: 8px 12px;
      border-radius: 10px;
      margin-bottom: 8px;
      font-size: 13.5px;
      line-height: 1.45;
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
        <button id="ifc-chat-close">✕</button>
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
  // Each entry: keys = trigger words/phrases (lowercase), reply = English response.
  // Matching is scored — the entry with the most matched keywords wins.
  // Add new entries anywhere in this array; order does not matter.

  const KB = [

    // ---------- GREETINGS ----------
    { keys: ["hi","hello","hey","salam","assalam"], reply: "Hello! Welcome to IT Freelancers Clients (IFC). I can tell you about our services, pricing, timelines, or how to get started. What would you like to know?" },
    { keys: ["good morning"], reply: "Good morning! How can I help you today — services, pricing, or getting started on a project?" },
    { keys: ["good afternoon"], reply: "Good afternoon! What can I help you with — our services, pricing, or starting a project?" },
    { keys: ["good evening"], reply: "Good evening! Happy to help — are you looking into a specific service or general information?" },
    { keys: ["how are you"], reply: "I'm doing well, thank you! I'm here to help with any questions about our services. What can I do for you?" },
    { keys: ["thank you","thanks","thankyou"], reply: "You're very welcome! Let me know if there's anything else you'd like to know about our services." },
    { keys: ["bye","goodbye","see you"], reply: "Thanks for stopping by! Feel free to reach out anytime through the Contact page if you have more questions." },
    { keys: ["who are you","what are you"], reply: "I'm the IFC Assistant — a virtual helper for IT Freelancers Clients. I can answer questions about our 10 services, pricing, timelines, and how to get started." },

    // ---------- COMPANY / ABOUT ----------
    { keys: ["what is ifc","what is it freelancers","about the company","about your company","tell me about ifc"], reply: "IT Freelancers Clients (IFC) is a digital agency offering 10 core services — including web development, graphic design, SEO, digital marketing, and more — helping businesses grow online." },
    { keys: ["where are you located","location","based in","which country"], reply: "We work remotely and serve clients internationally, so location isn't a barrier to working together. You can reach out through the Contact page regardless of where you're based." },
    { keys: ["are you available","availability","are you open"], reply: "Yes, we're currently accepting new projects. You can share your requirements through the Contact page and our team will get back to you promptly." },
    { keys: ["do you work on weekends","weekend"], reply: "Our team generally follows a standard weekly schedule, but urgent requests can often be accommodated. Feel free to mention your timeline when you reach out." },
    { keys: ["schedule a meeting","book a call","can we talk","set up a call"], reply: "Absolutely — please reach out through the Contact page with your preferred time and a brief note about your project, and our team will schedule a call with you." },
    { keys: ["international clients","work with clients abroad","overseas clients","global clients"], reply: "Yes, we regularly work with international clients. All communication, project management, and delivery are handled remotely and efficiently across time zones." },

    // ---------- SERVICES OVERVIEW ----------
    { keys: ["what services do you offer","your services","list of services","services you provide","what do you do"], reply: "We offer 10 core services:\n1. Freelancing\n2. Graphic Design\n3. Video Editing\n4. SEO\n5. Digital Marketing\n6. Affiliate Marketing\n7. Virtual Assistant\n8. E-commerce Management\n9. Communication & Soft Skills Training\n10. Web & App Development\n\nWhich one would you like to know more about?" },

    // ---------- FREELANCING ----------
    { keys: ["freelancing","freelance service","hire a freelancer"], reply: "Our Freelancing service connects you with skilled professionals for a wide range of tasks — from design and writing to development — on a project or ongoing basis." },

    // ---------- GRAPHIC DESIGN ----------
    { keys: ["graphic design","logo","design a logo","banner design","brand identity","design services"], reply: "Our Graphic Design service covers logos, banners, social media creatives, and complete brand identity design. Yes, we do design logos — you can see samples on our Portfolio page." },
    { keys: ["can you design logos","logo design"], reply: "Yes, we create custom logos as part of our Graphic Design service, tailored to your brand's identity and industry." },
    { keys: ["can you create social media posts","social media graphics","social media creatives"], reply: "Yes, designing social media posts and creatives is part of our Graphic Design service, matched to your brand's style and platform requirements." },

    // ---------- VIDEO EDITING ----------
    { keys: ["video editing","edit videos","youtube videos","reels editing"], reply: "Yes, we offer Video Editing services including YouTube videos, Instagram reels, and promotional content — from raw footage to a polished final product." },
    { keys: ["do you edit youtube videos"], reply: "Yes, editing YouTube videos is a core part of our Video Editing service, including cuts, transitions, captions, and color correction." },

    // ---------- SEO ----------
    { keys: ["seo","search engine optimization","google ranking","rank on google","optimize my website for google"], reply: "Our SEO service includes keyword research, on-page optimization, technical SEO, and content strategy to help your website rank higher on Google." },
    { keys: ["can you optimize my website for google"], reply: "Yes, that's exactly what our SEO service does — we optimize your site's structure, content, and technical setup to improve Google rankings." },

    // ---------- DIGITAL MARKETING ----------
    { keys: ["digital marketing","online marketing","marketing services","social media marketing","facebook ads","instagram ads"], reply: "Our Digital Marketing service covers social media marketing, paid ad campaigns, audience targeting, and strategy — designed to grow your brand's reach and conversions." },

    // ---------- AFFILIATE MARKETING ----------
    { keys: ["affiliate marketing","what is affiliate marketing","affiliate program"], reply: "Affiliate marketing is a performance-based strategy where you earn a commission for referring customers to a product or service. We help set up and manage affiliate marketing programs and campaigns for businesses." },

    // ---------- VIRTUAL ASSISTANT ----------
    { keys: ["virtual assistant","va service","do you provide virtual assistant services","admin support"], reply: "Yes, we provide Virtual Assistant services covering admin tasks, scheduling, email management, and daily business operations, so you can focus on growth." },

    // ---------- E-COMMERCE ----------
    { keys: ["e-commerce","ecommerce","online store","shopify","manage my online store","build e-commerce"], reply: "Our E-commerce Management service covers store setup, product listing, inventory management, and order processing. Yes, we also build e-commerce websites from scratch." },
    { keys: ["can you manage my online store"], reply: "Yes, our E-commerce Management service handles ongoing store operations including inventory, listings, and order management." },
    { keys: ["do you build e-commerce websites"], reply: "Yes, building e-commerce websites is part of our Web Development service, and we can also manage the store afterward through our E-commerce Management service." },

    // ---------- COMMUNICATION & SOFT SKILLS ----------
    { keys: ["communication","soft skills","training service","workplace communication"], reply: "Our Communication & Soft Skills training covers workplace communication, feedback, conflict resolution, negotiation, and leadership skills for individuals and teams." },

    // ---------- WEB & APP DEVELOPMENT ----------
    { keys: ["web development","website development","do you create websites","build a website","app development","website design"], reply: "Yes, we build websites and web applications — from simple business sites to custom-developed platforms — as part of our Web & App Development service." },
    { keys: ["do you create websites"], reply: "Yes, creating websites is one of our core services, covering everything from design to development and deployment." },
    { keys: ["can you redesign my existing website","website redesign","redesign my site"], reply: "Yes, we offer website redesign services — we can refresh your existing site's design, improve performance, and modernize its functionality." },

    // ---------- PRICING ----------
    { keys: ["how much do you charge","pricing","cost","price","rates","how much does it cost"], reply: "Pricing depends on the specific project's scope and requirements. Please share your project details through the Contact page and we'll provide a tailored quote." },
    { keys: ["do you offer monthly packages","monthly package","retainer"], reply: "Yes, we offer monthly retainer packages for ongoing services like SEO, digital marketing, social media management, and virtual assistant support." },
    { keys: ["what payment methods do you accept","payment methods","how do i pay"], reply: "We accept a range of standard payment methods depending on the client's location. Specific payment details will be shared once your project scope is confirmed." },

    // ---------- CONTACT ----------
    { keys: ["how can i contact you","contact","email","phone number","reach you","get in touch"], reply: "You can reach us through the Contact page on our website, where you can send project details or questions directly to our team." },
    { keys: ["how do i get started","get started","start a project"], reply: "Getting started is simple — just share your project details or requirements through the Contact page, and our team will follow up with next steps and a quote." },
    { keys: ["can i hire you for a long-term project","long-term project","ongoing project"], reply: "Yes, we work on both one-time projects and long-term ongoing engagements, including monthly retainers for continuous support." },

    // ---------- PORTFOLIO ----------
    { keys: ["portfolio","past work","previous projects","examples of your work","case studies"], reply: "You can view examples of our past work on the Portfolio page, covering design, development, and marketing projects across different industries." },

    // ---------- PROJECT TIMELINE ----------
    { keys: ["how long does a project take","project timeline","turnaround time","how long will it take"], reply: "Project timelines vary based on scope and complexity. Once we understand your specific requirements, we'll provide a realistic timeline before starting work." },

    // ---------- BUSINESS GROWTH ----------
    { keys: ["can you help my business grow","grow my business","help me grow"], reply: "Yes — our combination of services, from digital marketing and SEO to e-commerce management and web development, is specifically designed to support business growth." },

  ];

  // ================= 4. MATCHING ENGINE =================
  function ifcFindReply(userText) {
    const text = userText.toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const item of KB) {
      let score = 0;
      for (const k of item.keys) {
        if (text.includes(k)) score += k.split(" ").length; // longer phrase matches score higher
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

  // ================= 5. CHAT UI LOGIC =================
  const ifcQuickReplies = ["Our Services", "Pricing", "Contact", "Get Started"];

  function ifcAddMessage(text, sender) {
    const messages = document.getElementById('ifc-chat-messages');
    const div = document.createElement('div');
    div.className = 'ifc-msg ' + (sender === 'bot' ? 'ifc-bot' : 'ifc-user');
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function ifcAddBotMessage(text) { ifcAddMessage(text, 'bot'); }

  function ifcAddQuickReplies() {
    const messages = document.getElementById('ifc-chat-messages');
    const wrap = document.createElement('div');
    wrap.className = 'ifc-quick-replies';
    ifcQuickReplies.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'ifc-quick-btn';
      btn.textContent = q;
      btn.onclick = () => { ifcAddMessage(q, 'user'); ifcRespond(q); };
      wrap.appendChild(btn);
    });
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  function ifcRespond(userText) {
    setTimeout(() => {
      ifcAddBotMessage(ifcFindReply(userText));
    }, 400);
  }

  function ifcSend() {
    const input = document.getElementById('ifc-chat-input');
    const text = input.value.trim();
    if (!text) return;
    ifcAddMessage(text, 'user');
    input.value = '';
    ifcRespond(text);
  }

  function ifcToggleChat() {
    const box = document.getElementById('ifc-chat-box');
    const isOpen = box.style.display === 'flex';
    box.style.display = isOpen ? 'none' : 'flex';
    if (!isOpen && document.getElementById('ifc-chat-messages').children.length === 0) {
      ifcAddBotMessage("Hello! Welcome to IT Freelancers Clients. I can answer questions about our 10 services, pricing, timelines, or how to get started. What would you like to know?");
      ifcAddQuickReplies();
    }
  }

  // ================= 6. EVENT WIRING =================
  document.getElementById('ifc-chat-btn').addEventListener('click', ifcToggleChat);
  document.getElementById('ifc-chat-close').addEventListener('click', ifcToggleChat);
  document.getElementById('ifc-chat-send').addEventListener('click', ifcSend);
  document.getElementById('ifc-chat-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') ifcSend();
  });

})();
