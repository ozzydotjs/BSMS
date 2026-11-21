import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

interface AnalyzeIncidentRequest {
  incident_type?: string;
  narrative?: string;
  respondent_name?: string;
}

app.post('/api/analyze-incident', async (req, res) => {
  try {
    const body = req.body as AnalyzeIncidentRequest;
    const narrative = (body.narrative ?? '').trim();
    const incidentType = (body.incident_type ?? '').trim();

    if (!narrative || narrative.length < 10) {
      res.status(400).json({
        error: 'Please enter an incident narrative of at least 10 characters before requesting AI risk analysis.',
      });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Enter Likelihood and Consequence scores manually or configure GEMINI_API_KEY in Secrets.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = [
      'You are a Philippine Barangay Lupong Tagapamayapa and Public Safety Risk Analyst.',
      'Assess the following barangay incident report using a 5x5 risk matrix:',
      '- likelihood_score: integer 1 (rare/isolated) to 5 (almost certain/ongoing escalation)',
      '- consequence_score: integer 1 (minor nuisance) to 5 (severe bodily harm, major property loss, or community hazard)',
      '- risk_level: "low" if likelihood*consequence <= 6, "medium" if 7..14, "high" if >= 15',
      '- rationale: concise 1 to 2 sentence explanation grounded in the narrative.',
      '',
      `Incident Type: ${incidentType || 'General Dispute'}`,
      `Narrative: ${narrative}`,
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            likelihood_score: {
              type: Type.INTEGER,
              description: 'Likelihood score from 1 to 5.',
            },
            consequence_score: {
              type: Type.INTEGER,
              description: 'Consequence severity score from 1 to 5.',
            },
            rationale: {
              type: Type.STRING,
              description: 'Concise 1-2 sentence rationale for the assigned risk scores.',
            },
          },
          required: ['likelihood_score', 'consequence_score', 'rationale'],
        },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      res.status(502).json({ error: 'AI service returned an empty response. Please try again or score manually.' });
      return;
    }

    const parsed = JSON.parse(rawText) as {
      likelihood_score?: number;
      consequence_score?: number;
      rationale?: string;
    };

    const likelihood = Math.min(5, Math.max(1, Math.round(Number(parsed.likelihood_score ?? 3))));
    const consequence = Math.min(5, Math.max(1, Math.round(Number(parsed.consequence_score ?? 3))));
    const riskScore = likelihood * consequence;
    const riskLevel = riskScore >= 15 ? 'high' : riskScore >= 7 ? 'medium' : 'low';

    res.json({
      likelihood_score: likelihood,
      consequence_score: consequence,
      risk_score: riskScore,
      risk_level: riskLevel,
      rationale: String(parsed.rationale ?? '').trim(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to analyze incident risk.';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Barangay MIS server listening on http://localhost:${PORT}`);
  });
}

startServer();
