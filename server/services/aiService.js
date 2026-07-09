const OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'meta-llama/llama-3.2-3b-instruct',
  'meta-llama/llama-3.3-70b-instruct',
];

const searchMedlinePlus = async (query) => {
  try {
    if (!query) return '';
    console.log(`[MedlinePlus] Searching for: ${query}`);
    const url = `https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=${encodeURIComponent(query)}&retmax=3`;
    const response = await fetch(url);
    if (!response.ok) return '';
    const xmlText = await response.text();

    const documentRegex = /<document[^>]*>([\s\S]*?)<\/document>/g;
    const titleRegex = /<content name="title">([\s\S]*?)<\/content>/;
    const summaryRegex = /<content name="FullSummary">([\s\S]*?)<\/content>/;

    let summary = '';
    let match;
    
    while ((match = documentRegex.exec(xmlText)) !== null) {
      const docContent = match[1];
      const titleMatch = titleRegex.exec(docContent);
      const summaryMatch = summaryRegex.exec(docContent);

      if (titleMatch) {
        const title = titleMatch[1].trim();
        let body = '';
        if (summaryMatch) {
          body = summaryMatch[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/<[^>]*>?/gm, '')
            .trim();
        }
        summary += `Source: MedlinePlus - ${title}\nInfo: ${body}\n\n`;
      }
    }

    return summary.substring(0, 1500);
  } catch (error) {
    console.warn('[MedlinePlus] Search failed:', error.message);
    return '';
  }
};

const getSymptomPrompt = (patientData, medicalContext) => `
You are an expert AI Medical Assistant. Analyze the patient's structured data and the provided medical knowledge base context to generate a clinical assessment.
Do NOT use Markdown formatting in your response. Return ONLY the RAW JSON object.

Patient Details:
- Age: ${patientData.age}
- Gender: ${patientData.gender}
- Weight: ${patientData.weight || 'N/A'} kg
- Height: ${patientData.height || 'N/A'} cm
- Existing Conditions: ${patientData.existingConditions || 'None'}
- Current Medications: ${patientData.currentMedications || 'None'}
- Allergies: ${patientData.allergies || 'None'}
- Pregnancy Status: ${patientData.pregnancyStatus || 'N/A'}
- Pain Level (1-10): ${patientData.painLevel || 'N/A'}
- Duration: ${patientData.duration}
- Primary Symptoms: ${patientData.primarySymptoms?.join(', ') || 'None'}
- Secondary Symptoms: ${patientData.secondarySymptoms?.join(', ') || 'None'}
- Additional Description: ${patientData.symptoms || 'None'}

Medical Knowledge Base Context:
${medicalContext || 'No specific context retrieved.'}

You must return a JSON object with EXACTLY this structure:
{
  "possibleConditions": [
    {
      "condition": "string (name of the condition)",
      "confidenceScore": number (percentage 0-100),
      "supportingSymptoms": "string (why this condition matches the patient's symptoms)"
    }
  ], // Generate exactly 3 conditions
  "redFlagDetected": boolean (true ONLY if symptoms indicate an immediate life-threatening emergency like severe chest pain, stroke symptoms, extreme breathlessness),
  "severityLevel": "string (MUST be one of: 'Mild', 'Moderate', 'Severe')",
  "recommendedSpecialty": "string (name of medical specialty, e.g. General Physician, Cardiologist, Emergency Medicine)",
  "healthAdvice": "string (safe home care advice, NEVER recommend prescription medicines)",
  "sources": ["string (e.g. 'MedlinePlus', 'WHO', etc. based on the Medical Context provided or general knowledge)"]
}
`;

function normalizeAIResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(cleaned);

    if (parsed.possibleConditions && Array.isArray(parsed.possibleConditions)) {
      let sev = String(parsed.severityLevel);
      if (sev.toLowerCase().includes('severe') || parsed.redFlagDetected) {
        parsed.severityLevel = 'Severe';
      } else if (sev.toLowerCase().includes('mod')) {
        parsed.severityLevel = 'Moderate';
      } else {
        parsed.severityLevel = 'Mild';
      }
      
      if (!parsed.sources || parsed.sources.length === 0) {
        parsed.sources = ['General Medical Knowledge'];
      }
      
      return parsed;
    }
  } catch (err) {
    console.warn('[AI Service] JSON parsing failed:', err.message);
  }

  return null;
}

function runLocalClinicalFallback(patientData) {
  console.log('[LocalClinicalEngine] Running fallback rules...');
  return {
    possibleConditions: [
      {
        condition: 'General Health Consultation',
        confidenceScore: 70,
        supportingSymptoms: 'Matches the provided clinical profile.'
      },
      {
        condition: 'Observation Recommended',
        confidenceScore: 50,
        supportingSymptoms: 'A physical examination is advised.'
      },
      {
        condition: 'Viral/Bacterial Infection',
        confidenceScore: 30,
        supportingSymptoms: 'Common baseline diagnosis for acute symptoms.'
      }
    ],
    redFlagDetected: false,
    severityLevel: 'Mild',
    recommendedSpecialty: 'General Physician',
    healthAdvice: 'Please rest, stay hydrated, and consult a doctor if symptoms worsen or persist.',
    sources: ['Local Fallback Engine']
  };
}

const callOpenRouter = async (prompt) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('No OpenRouter API key configured');

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:5000',
    'X-Title': 'Dooper AI Symptom Checker'
  };

  let waitTime = 3000;
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: OPENROUTER_MODELS[attempt] || OPENROUTER_MODELS[0],
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' }
        })
      });

      if (response.status === 200) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const parsed = normalizeAIResponse(content);
        if (parsed) return parsed;
      } else if (response.status === 429) {
        console.warn(`[OpenRouter] Rate limited (429). Retrying in ${waitTime / 1000}s...`);
        await new Promise(r => setTimeout(r, waitTime));
        waitTime *= 2;
      } else {
        const errText = await response.text();
        console.warn(`[OpenRouter] HTTP error ${response.status}: ${errText}`);
      }
    } catch (err) {
      console.warn(`[OpenRouter] Error on attempt ${attempt + 1}: ${err.message}`);
      if (attempt === maxAttempts - 1) throw err;
      await new Promise(r => setTimeout(r, waitTime));
      waitTime *= 2;
    }
  }

  throw new Error('Could not retrieve a valid structured response from OpenRouter');
};

const getSymptomCheck = async (patientData) => {
  // 1. Fetch Medical Knowledge Base Context
  const query = patientData.primarySymptoms?.join(' ') || patientData.symptoms || 'general symptoms';
  const medicalContext = await searchMedlinePlus(query);

  // 2. Generate Prompt
  const prompt = getSymptomPrompt(patientData, medicalContext);

  if (process.env.OPENROUTER_API_KEY) {
    for (const model of OPENROUTER_MODELS) {
      try {
        console.log(`[OpenRouter] Invoking model: ${model}...`);
        const result = await callOpenRouter(prompt);
        console.log(`[OpenRouter] Success with model: ${model}`);
        return result;
      } catch (err) {
        console.warn(`[OpenRouter] Model ${model} failed, trying next...`);
      }
    }
  }

  // Fallback
  return runLocalClinicalFallback(patientData);
};

const getChatFollowUp = async (assessment, message, chatHistory) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return 'AI chat is unavailable (no API key). Please consult a General Physician for follow-up questions.';
  }

  const primaryCondition = assessment.aiAnalysis.possibleConditions?.[0]?.condition || 'the assessed condition';

  const systemPrompt = `You are an expert AI Medical Assistant specializing in follow-up consultation.
You are chatting with a patient about their recent symptom assessment.
- Patient: ${assessment.age} yrs, ${assessment.gender}
- Primary Symptoms: ${assessment.primarySymptoms?.join(', ') || assessment.symptoms}
- Assessment result: Top Condition: ${primaryCondition}, Severity: ${assessment.aiAnalysis.severityLevel}, Specialty: ${assessment.aiAnalysis.recommendedSpecialty}.

Guidelines:
1. Be helpful, accurate, empathetic, and clear.
2. NEVER prescribe specific medications or dosages.
3. Keep answers concise (3-4 sentences max).
4. If they report new severe symptoms, advise immediate medical attention.
5. Remind the patient to consult a real doctor for an actual diagnosis.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content })),
    { role: 'user', content: message }
  ];

  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:5000',
    'X-Title': 'Dooper AI Followup Chat'
  };

  for (const model of OPENROUTER_MODELS) {
    try {
      console.log(`[Chat] Trying model: ${model}`);
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.5,
          max_tokens: 350
        })
      });

      if (response.status === 200) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (reply) {
          console.log(`[Chat] Success with model: ${model}`);
          return reply;
        }
      } else {
        const errText = await response.text();
        console.warn(`[Chat] Model ${model} returned ${response.status}: ${errText.slice(0, 200)}`);
      }
    } catch (err) {
      console.warn(`[Chat] Model ${model} threw error: ${err.message}`);
    }
  }

  return `Based on your assessment of "${primaryCondition}", I recommend following the health advice provided in your report. For specific questions, please consult a ${assessment.aiAnalysis.recommendedSpecialty}. I'm currently unable to reach the AI service, but your report contains useful guidance.`;
};

module.exports = {
  getSymptomCheck,
  getChatFollowUp
};
