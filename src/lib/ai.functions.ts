import { createServerFn } from "@tanstack/react-start";

export const askAi = createServerFn({ method: "POST" })
  .inputValidator((input: { prompt: string; context?: string }) => {
    if (!input || typeof input.prompt !== "string" || !input.prompt.trim()) {
      throw new Error("Prompt is required");
    }
    return { prompt: input.prompt.slice(0, 4000), context: (input.context ?? "").slice(0, 2000) };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY not configured");

    const systemPrompt =
      "You are an assistant embedded in a multi-company CRM dashboard (leads, deals, payments, tasks, quotations). " +
      "Answer concisely with actionable bullet points, next steps, and drafts when asked. " +
      "When drafting follow-up messages, keep them under 90 words, warm, and professional. " +
      "Currency is INR. Today is " + new Date().toISOString().slice(0, 10) + ".";

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          ...(data.context ? [{ role: "system", content: `Context:\n${data.context}` }] : []),
          { role: "user", content: data.prompt },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq error ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return { text: json.choices?.[0]?.message?.content ?? "" };
  });
