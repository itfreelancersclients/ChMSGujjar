/* ==========================================================
   IFC CHATBOT — GEMINI PROXY (Cloudflare Worker)
   UPDATED VERSION — fixes model name

   WHAT WAS FIXED THIS TIME:
   The model "gemini-2.5-flash-lite" is no longer available to
   new API keys (Google retired it for new users). This version
   uses the current model: gemini-3.5-flash-lite.

   (Earlier fix, still included: CORS preflight OPTIONS requests
   are handled before the POST-only check, so the browser's
   preflight check succeeds and the real request goes through.)

   SETUP: Your GEMINI_API_KEY secret is already saved in this
   Worker — you only need to replace the CODE.
   Go to your Worker → Edit Code → select all → delete →
   paste this entire file → Save and Deploy.
========================================================== */

export default {
  async fetch(request, env) {

    // Handle CORS preflight FIRST (browsers send this automatically
    // before the real POST — must be answered before any other check)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    // Allow the real request only via POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Use POST with a JSON body: { message: '...' }" }), {
        status: 405,
        headers: corsHeaders(),
      });
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: { maxOutputTokens: 150 },
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
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}