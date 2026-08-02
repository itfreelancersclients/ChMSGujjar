/* ==========================================================
   IFC CHATBOT — GEMINI PROXY (Cloudflare Worker)

   PURPOSE:
   Your GitHub Pages site is static — there is no safe way to
   store a secret API key directly in your ifc-chatbot.js file,
   because anyone can open the browser's dev tools and read it.

   This tiny Worker sits between your chatbot and Google's Gemini
   API. Your chatbot calls THIS Worker (which is safe to expose
   publicly), and the Worker attaches your real Gemini API key
   on the server side, where visitors can never see it.

   COST: Free. Cloudflare Workers free tier gives 100,000
   requests/day — far more than a small business chatbot needs.

   ===================== SETUP STEPS =========================

   1. Go to https://dash.cloudflare.com → sign up (free).
   2. In the left sidebar: Workers & Pages → Create → Create Worker.
   3. Give it a name, e.g. "ifc-chat-proxy". Deploy it (default
      "Hello World" code is fine for now).
   4. Click "Edit Code" and DELETE everything, then paste this
      entire file in its place. Click "Save and Deploy".
   5. Get a free Gemini API key: https://aistudio.google.com/apikey
   6. In your Worker's dashboard: Settings → Variables and Secrets
      → Add a Secret named GEMINI_API_KEY, paste your key, Save.
      (Using a Secret — not a plain variable — keeps it encrypted
      and hidden even from you after saving.)
   7. Your Worker will have a public URL like:
      https://ifc-chat-proxy.YOURNAME.workers.dev
      Copy this — you'll paste it into ifc-chatbot.js next.

   That's it. Test it by visiting the URL in a browser — it
   should return a small JSON error (since it needs a POST
   request with a message), which confirms it's live.
========================================================== */

export default {
  async fetch(request, env) {

    // Allow requests only via POST (chatbot sends the user's message this way)
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST with a JSON body: { message: '...' }" }), {
        status: 405,
        headers: corsHeaders(),
      });
    }

    // Handle CORS preflight (browsers send this automatically before the real POST)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    try {
      const { message, context } = await request.json();

      if (!message || typeof message !== "string") {
        return new Response(JSON.stringify({ error: "Missing 'message' in request body." }), {
          status: 400,
          headers: corsHeaders(),
        });
      }

      // System instruction keeps replies on-topic and on-brand for IFC
      const systemInstruction = context || `You are the IFC (IT Freelancers Clients) Assistant. Answer briefly and helpfully about IFC's 10 services: Freelancing, Graphic Design, Video Editing, SEO, Digital Marketing, Affiliate Marketing, Virtual Assistant, E-commerce Management, Communication & Soft Skills, and App/Web Development. Keep replies under 60 words, friendly and professional. If asked something unrelated to IFC or digital services, politely redirect to how IFC can help.`;

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
          }),
        }
      );

      const data = await geminiRes.json();

      if (!geminiRes.ok) {
        return new Response(JSON.stringify({ error: "Gemini API error", details: data }), {
          status: geminiRes.status,
          headers: corsHeaders(),
        });
      }

      const reply =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't generate a reply right now. Please try again or use the Contact page.";

      return new Response(JSON.stringify({ reply }), {
        status: 200,
        headers: corsHeaders(),
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: "Server error", details: String(err) }), {
        status: 500,
        headers: corsHeaders(),
      });
    }
  },
};

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", // you can restrict this to your domain later, e.g. "https://itfreelancersclients.github.io"
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
