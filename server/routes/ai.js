const express = require('express');
const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-1.5-pro';

function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts || !Array.isArray(parts)) return '';
  return parts.map((p) => p?.text || '').join(' ').trim();
}

async function callGemini(prompt, temperature = 0.3) {
  if (!GEMINI_API_KEY) {
    const err = new Error('Gemini API key not configured on the server');
    err.status = 503;
    throw err;
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
      GEMINI_API_KEY
    )}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Gemini request failed (${res.status}) ${body || ''}`.trim());
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return extractGeminiText(data);
}

router.post('/quiz', async (req, res, next) => {
  try {
    const docText = String(req.body?.docText || '').trim();
    if (!docText) return res.status(400).json({ error: 'docText is required' });
    const context = docText.length > 12000 ? docText.slice(0, 12000) : docText;
    const prompt = `You are an expert tutor. From the document below, produce 5 progressively deeper, open-ended questions.
For each item include 2-5 key concepts you expect in a strong answer.
Return strict JSON:
{"questions":[{"q":"...", "keywords":["k1","k2","k3"]}, ...]}
Document:
${context}`;
    const raw = await callGemini(prompt, 0.4);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return res.status(502).json({ error: 'Gemini returned unparseable response', raw });
    }
    if (!parsed?.questions?.length) return res.status(502).json({ error: 'No questions returned', raw });
    return res.json({ questions: parsed.questions.slice(0, 5) });
  } catch (e) {
    next(e);
  }
});

router.post('/answer', async (req, res, next) => {
  try {
    const docText = String(req.body?.docText || '').trim();
    const question = String(req.body?.question || '').trim();
    if (!docText || !question) return res.status(400).json({ error: 'docText and question are required' });
    const context = docText.length > 16000 ? docText.slice(0, 16000) : docText;
    const system =
      'You are a warm, concise teacher. Use only the provided document. Explain clearly, give a tiny example, and end with one short follow-up question to check understanding. Stay brief.';
    const prompt = `${system}\n\nDocument:\n${context}\n\nQuestion: ${question}\n\nRespond in 2-3 short paragraphs maximum, plus one follow-up question.`;
    const answer = await callGemini(prompt, 0.3);
    return res.json({ answer: answer || 'No answer.' });
  } catch (e) {
    next(e);
  }
});

router.post('/eval', async (req, res, next) => {
  try {
    const docText = String(req.body?.docText || '').trim();
    const question = String(req.body?.question || '').trim();
    const studentAnswer = String(req.body?.answer || '').trim();
    const keywords = Array.isArray(req.body?.keywords) ? req.body.keywords : [];
    if (!docText || !question || !studentAnswer) return res.status(400).json({ error: 'docText, question, and answer are required' });
    const context = docText.length > 16000 ? docText.slice(0, 16000) : docText;
    const evalPrompt = `You are an expert tutor. Evaluate the student's answer concisely with depth.
Question: ${question}
Expected key concepts: ${(keywords || []).join(', ')}
Student answer: ${studentAnswer}
Use ONLY the provided document context:
${context}
Provide at most 4 short bullet points:
- Correctness and coverage of key ideas
- Missing or incorrect points
- One improvement suggestion
- 1 short reinforcing tip or next step
End with one short follow-up question to help the student reflect.`;
    const feedback = await callGemini(evalPrompt, 0.2);
    return res.json({ feedback: feedback || '' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;


