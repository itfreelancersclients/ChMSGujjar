/* ==========================================================
   IFC CHATBOT — GEMINI AI FALLBACK ADD-ON

   WHAT THIS DOES:
   Your current ifc-chatbot.js first checks its 87-entry
   knowledge base (KB) using fuzzy matching. When NOTHING in
   the KB matches well enough, it currently shows some default
   "I'm not sure" reply.

   This add-on replaces that moment with a call to Gemini AI
   (via your Cloudflare Worker proxy), so the bot can actually
   understand and answer questions that aren't in the KB —
   while still using the free, fast KB lookup for anything it
   already knows (saving API calls and staying instant).

   ===================== SETUP STEPS =========================

   1. Deploy the Cloudflare Worker from
      "cloudflare-worker-proxy.js" first (see its own comments).
   2. Paste your Worker's URL below in WORKER_URL.
   3. Add this file to your site AFTER ifc-chatbot.js loads:

        <script src="ifc-chatbot.js" defer></script>
        <script src="ifc-chatbot-gemini-addon.js" defer></script>

   4. In ifc-chatbot.js, find the place where it decides there's
      NO good KB match (the fuzzy-match score is too low) and
      it currently shows a fallback reply like:
        "I'm sorry, I didn't quite understand that..."

      Replace that fallback line with a call to:
        window.ifcAskGemini(userMessage).then(reply => {
          addBotMessage(reply); // use whatever function your
                                 // chatbot uses to render a bot reply
        });

      (Exact function/variable names depend on your file's
      internal structure — since I only saw part of it, use
      the pattern above wherever the "no match found" case is.
      Paste me that specific block if you want it wired in
      exactly, and I'll give you the precise replacement.)
========================================================== */

(function () {

  // PASTE YOUR CLOUDFLARE WORKER URL HERE (from Step 7 of the Worker setup):
  const WORKER_URL = "https://ifc-chat-proxy.shadapunjabi75.workers.dev";

  /**
   * Calls Gemini AI (through the Cloudflare Worker) with the user's message.
   * Returns a Promise that resolves to a plain-text reply string.
   */
  window.ifcAskGemini = async function (userMessage) {
    try {
      const res = await fetch(WORKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      if (!res.ok || !data.reply) {
        console.error("IFC chatbot: Gemini fallback failed", data);
        return "I'm not sure about that one — could you rephrase, or reach out through our Contact page for a direct answer?";
      }

      return data.reply;

    } catch (err) {
      console.error("IFC chatbot: network error calling Gemini proxy", err);
      return "I'm having trouble connecting right now. Please try again in a moment, or use the Contact page.";
    }
  };

})();
