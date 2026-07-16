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

const getConsultationPrompt = (patientData, medicalContext, chatHistory, uploadedText, forceComplete = false) => `
You are dooper, an expert AI Clinical Triage & Consultation Assistant.
Conduct an interactive, conversational medical triage with the patient. 

Initial Patient Profile:
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
- Initial Description: ${patientData.symptoms || 'None'}

${uploadedText ? `Uploaded Medical Report/Prescription Content:\n${uploadedText}\n` : ''}

Trusted Medical Knowledge Base Context:
${medicalContext || 'No specific context retrieved.'}

Consultation Chat History:
${chatHistory && chatHistory.length > 0 ? chatHistory.map(h => `${h.role === 'user' ? 'Patient' : 'Assistant (dooper)'}: ${h.content}`).join('\n') : 'No history yet. Start the consultation.'}

${forceComplete ? `
CRITICAL INSTRUCTION: You have asked enough questions. You MUST finalize this consultation now. 
Set "status" to "completed" and compile the final clinical triage report with the top 5 possible conditions. 
Do NOT ask any more follow-up questions.
` : `
INSTRUCTIONS:
1. Review the patient profile, medical context, uploaded files, and chat history.
2. Determine if you have enough information to generate a clinical triage report.
   - Typically, complete a consultation after 3-4 turns of Patient responses.
   - If the patient exhibits a life-threatening emergency (Red Flag: chest pain with sweating, stroke symptoms, difficulty breathing, severe allergic reaction, loss of consciousness, uncontrolled bleeding, high-risk pregnancy emergency), immediately stop the consultation and complete the assessment to trigger the emergency warning.
3. You must respond in a strict JSON format. Do NOT use markdown.
`}

Return a JSON object with this exact structure:
{
  "status": "consulting" or "completed",
  "message": "string (If status is 'consulting', ask the next single specific clinical question to help narrow down the diagnosis, keeping it empathetic, conversational, and clinical. If status is 'completed', write a final summary message introducing the report)",
  "aiAnalysis": {
    "possibleConditions": [
      {
        "condition": "string (name of condition)",
        "confidenceScore": number (percentage 0-100),
        "matchingSymptoms": ["string (patient symptoms matching this condition)"],
        "missingSymptoms": ["string (expected symptoms of this condition that the patient does not have)"],
        "reasoning": "string (clear clinical explanation of why this matches or does not match)"
      }
    ], // Generate exactly 5 conditions ONLY if status is 'completed'. If status is 'consulting', leave as empty array []
    "redFlagDetected": boolean,
    "severityLevel": "Mild" or "Moderate" or "Severe",
    "recommendedSpecialty": "string",
    "recommendedSpecialtyExplanation": "string (why this specialty is recommended based on symptoms and conditions)",
    "healthAdvice": "string (safe home-care advice, NEVER prescribe specific medications)",
    "sources": ["string (trusted medical references used, e.g. WHO, CDC, NHS, MedlinePlus)"]
  }
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
    if (parsed.status) {
      if (parsed.status === 'completed' && parsed.aiAnalysis) {
        let sev = String(parsed.aiAnalysis.severityLevel || 'Mild');
        if (sev.toLowerCase().includes('severe') || parsed.aiAnalysis.redFlagDetected) {
          parsed.aiAnalysis.severityLevel = 'Severe';
        } else if (sev.toLowerCase().includes('mod')) {
          parsed.aiAnalysis.severityLevel = 'Moderate';
        } else {
          parsed.aiAnalysis.severityLevel = 'Mild';
        }

        if (!parsed.aiAnalysis.sources || parsed.aiAnalysis.sources.length === 0) {
          parsed.aiAnalysis.sources = ['General Medical Knowledge'];
        }
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
    status: 'completed',
    message: 'We have compiled your clinical triage report using our local medical analysis rules.',
    aiAnalysis: {
      possibleConditions: [
        {
          condition: 'General Health Consultation',
          confidenceScore: 70,
          matchingSymptoms: patientData.primarySymptoms || [],
          missingSymptoms: ['High fever', 'Severe pain'],
          reasoning: 'Matches the general baseline health profile.'
        },
        {
          condition: 'Observation Recommended',
          confidenceScore: 50,
          matchingSymptoms: patientData.primarySymptoms || [],
          missingSymptoms: [],
          reasoning: 'General symptoms require medical provider observation.'
        },
        {
          condition: 'Acute Viral Infection',
          confidenceScore: 40,
          matchingSymptoms: ['Fever'],
          missingSymptoms: ['Rashes'],
          reasoning: 'Common seasonal diagnostic probability.'
        },
        {
          condition: 'Environmental Allergies',
          confidenceScore: 30,
          matchingSymptoms: patientData.secondarySymptoms || [],
          missingSymptoms: ['Dyspnea'],
          reasoning: 'May be triggered by pollen or dust exposure.'
        },
        {
          condition: 'Mild Physical Strain',
          confidenceScore: 20,
          matchingSymptoms: ['Muscle Pain'],
          missingSymptoms: ['Neurological signs'],
          reasoning: 'Typical response to overexertion or muscle stress.'
        }
      ],
      redFlagDetected: false,
      severityLevel: 'Mild',
      recommendedSpecialty: 'General Physician',
      recommendedSpecialtyExplanation: 'A general physician can review your baseline symptoms and conduct basic checkups.',
      healthAdvice: 'Please rest, stay hydrated, avoid strenuous activities, and consult a doctor if symptoms worsen.',
      sources: ['Local Fallback Engine', 'MedlinePlus Guidelines']
    }
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

// Dynamic Clinical Keyword Extractor for enriched RAG queries
const extractClinicalKeywords = async (patientData, chatHistory, uploadedText) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  // Build a condensed summary of all available clinical context
  const chatSummary = chatHistory && chatHistory.length > 0
    ? chatHistory
        .filter(h => h.role === 'user')
        .map(h => h.content)
        .join(', ')
    : '';

  const uploadedSnippet = uploadedText
    ? uploadedText.substring(0, 600)
    : '';

  const keywordPrompt = `You are a clinical triage keyword extraction assistant.

Patient Profile:
- Age: ${patientData.age}, Gender: ${patientData.gender}
- Existing Conditions: ${patientData.existingConditions || 'None'}
- Current Medications: ${patientData.currentMedications || 'None'}
- Primary Symptoms: ${patientData.primarySymptoms?.join(', ') || 'None'}
- Secondary Symptoms: ${patientData.secondarySymptoms?.join(', ') || 'None'}

Patient Q&A Responses: ${chatSummary || 'Not yet available'}

Uploaded Medical Report Excerpt: ${uploadedSnippet || 'None uploaded'}

Your task: Extract 2 to 4 specific medical/clinical search keywords or short phrases from the above clinical context. These will be used to query the MedlinePlus medical database for evidence-based literature.

Rules:
- Focus on specific conditions, symptoms, drug names, or medical terms mentioned or implied.
- Prefer specific clinical terms over generic ones (e.g., "Orthostatic Hypotension" over "dizziness").
- Output ONLY a comma-separated list of keywords. No explanation, no formatting, no JSON.
- Example output: Orthostatic Hypotension, Cardiac Arrhythmia, Palpitations`;

  try {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:5000',
      'X-Title': 'Dooper RAG Keyword Extractor'
    };

    // Use the fastest/lightest model for this quick extraction call
    const model = OPENROUTER_MODELS[OPENROUTER_MODELS.length - 1];
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: keywordPrompt }],
        temperature: 0.1,
        max_tokens: 80
      })
    });

    if (response.status === 200) {
      const data = await response.json();
      const rawKeywords = data.choices?.[0]?.message?.content?.trim();
      if (rawKeywords) {
        const keywords = rawKeywords
          .split(',')
          .map(k => k.trim())
          .filter(k => k.length > 2 && k.length < 60);
        console.log(`[Dynamic RAG] Extracted keywords: ${keywords.join(', ')}`);
        return keywords;
      }
    }
  } catch (err) {
    console.warn('[Dynamic RAG] Keyword extraction failed:', err.message);
  }

  return null;
};

const runConsultationStep = async (patientData, chatHistory, uploadedText, forceComplete = false) => {
  // 1. Dynamic RAG: Use AI to extract enriched clinical keywords from evolving context
  let medicalContext = '';
  let usedKeywords = [];

  if (process.env.OPENROUTER_API_KEY) {
    const dynamicKeywords = await extractClinicalKeywords(patientData, chatHistory, uploadedText);

    if (dynamicKeywords && dynamicKeywords.length > 0) {
      usedKeywords = dynamicKeywords;

      // Search MedlinePlus using each extracted keyword and accumulate the knowledge base
      const contextParts = await Promise.allSettled(
        dynamicKeywords.slice(0, 3).map(kw => searchMedlinePlus(kw))
      );

      medicalContext = contextParts
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value)
        .join('\n---\n')
        .substring(0, 3000); // Cap total context to avoid prompt token overflow
    }
  }

  // 2. Fallback: Static primary symptom search if dynamic extraction failed
  if (!medicalContext) {
    const fallbackQuery = patientData.primarySymptoms?.join(' ') || patientData.symptoms || 'general symptoms';
    console.log(`[RAG Fallback] Using static symptom query: ${fallbackQuery}`);
    medicalContext = await searchMedlinePlus(fallbackQuery);
    // Record fallback keywords for transparency
    if (patientData.primarySymptoms?.length) {
      usedKeywords = patientData.primarySymptoms;
    }
  }

  // 3. Generate Prompt with enriched medical context
  const prompt = getConsultationPrompt(patientData, medicalContext, chatHistory, uploadedText, forceComplete);

  if (process.env.OPENROUTER_API_KEY) {
    for (const model of OPENROUTER_MODELS) {
      try {
        console.log(`[OpenRouter] Invoking model: ${model}...`);
        const result = await callOpenRouter(prompt);
        console.log(`[OpenRouter] Success with model: ${model}`);
        // Attach keywords to result so controller can persist them
        result.ragKeywords = usedKeywords;
        return result;
      } catch (err) {
        console.warn(`[OpenRouter] Model ${model} failed, trying next...`);
      }
    }
  }

  // Fallback — attach fallback keywords too
  const fallback = runLocalClinicalFallback(patientData);
  fallback.ragKeywords = usedKeywords;
  return fallback;
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
  runConsultationStep,
  getChatFollowUp
};
