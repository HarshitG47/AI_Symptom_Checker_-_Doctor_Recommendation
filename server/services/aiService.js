
const OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'meta-llama/llama-3.2-3b-instruct',
  'meta-llama/llama-3.3-70b-instruct',
];

const getSymptomPrompt = (symptoms, age, gender, duration, existingConditions) => `
You are an expert AI Medical Assistant. Analyze the user's details and symptoms to provide a structured JSON response.
Do NOT use Markdown formatting (like \`\`\`json) in your response, return ONLY the RAW JSON object.

Input details:
- Symptoms: ${symptoms}
- Age: ${age}
- Gender: ${gender}
- Duration of symptoms: ${duration}
- Existing medical conditions: ${existingConditions || 'None reported'}

The JSON MUST have exactly this structure:
{
  "possibleCondition": "string (name of possible condition, e.g. Gastritis, Migraine)",
  "explanation": "string (explain the possible condition in 2-3 sentences)",
  "severityLevel": "string (MUST be one of: 'Mild', 'Moderate', 'Severe')",
  "recommendedSpecialty": "string (name of medical specialty, e.g. General Physician, Cardiologist, Dermatologist, Neurologist)",
  "healthAdvice": "string (basic self-care suggestions and recommendations)"
}

Guidelines:
- Maintain medical safety and safe clinical communication.
- If symptoms indicate a life-threatening emergency (e.g., severe chest pain, extreme breathlessness), classify as 'Severe', recommend a 'Cardiologist' or 'Emergency Medicine', and write urgent advice to seek immediate emergency care.
- Ensure the disclaimer is NOT inside the JSON values, but will be shown by the UI. Only return the requested JSON fields.
`;

function normalizeAIResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;

  // Clean markdown code blocks
  let cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  // Extract JSON object substring if model surrounded it with text
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(cleaned);

    // Validate required fields
    if (parsed.possibleCondition && parsed.explanation && parsed.severityLevel && parsed.recommendedSpecialty && parsed.healthAdvice) {
      // Normalize severity
      let sev = String(parsed.severityLevel);
      if (sev.toLowerCase().includes('severe') || sev.toLowerCase().includes('critical') || sev.toLowerCase().includes('high')) {
        parsed.severityLevel = 'Severe';
      } else if (sev.toLowerCase().includes('mod')) {
        parsed.severityLevel = 'Moderate';
      } else {
        parsed.severityLevel = 'Mild';
      }
      return parsed;
    }
  } catch (err) {
    console.warn('[AI Service] JSON parsing failed:', err.message);
  }

  return null;
}

// Local smart clinical fallback engine
function runLocalClinicalFallback(symptoms, age, gender, duration, existingConditions) {
  console.log('[LocalClinicalEngine] Running local diagnostic rules...');
  const text = (symptoms || '').toLowerCase();

  let result = {
    possibleCondition: 'General Health Consultation',
    explanation: 'Based on your reported symptoms, a physical examination by a healthcare provider is recommended to determine the underlying cause.',
    severityLevel: 'Mild',
    recommendedSpecialty: 'General Physician',
    healthAdvice: 'Please rest, ensure you are well-hydrated, and track your temperature. Avoid heavy physical exertion until you consult a doctor.'
  };

  if (text.includes('chest pain') || text.includes('heart') || text.includes('shortness of breath') || text.includes('breathless') || text.includes('breathing difficulty')) {
    result = {
      possibleCondition: 'Potential Cardiorespiratory Distress',
      explanation: 'Symptoms like chest discomfort or difficulty breathing could indicate an urgent cardiac or respiratory issue.',
      severityLevel: 'Severe',
      recommendedSpecialty: 'Cardiologist / Emergency Medicine',
      healthAdvice: 'Seek IMMEDIATE emergency medical attention. Rest in an upright position. Do not engage in any physical exertion.'
    };
  } else if (text.includes('headache') || text.includes('migraine') || text.includes('throbbing head') || text.includes('head pain')) {
    result = {
      possibleCondition: 'Migraine / Tension Headache',
      explanation: 'A neurological symptom characterized by moderate-to-severe pain, often throbbing, which can be triggered by stress, fatigue, or dehydration.',
      severityLevel: 'Moderate',
      recommendedSpecialty: 'Neurologist',
      healthAdvice: 'Rest in a quiet, dark room. Apply a cool compress to your forehead. Maintain hydration and avoid bright screens.'
    };
  } else if (text.includes('stomach') || text.includes('acid') || text.includes('heartburn') || text.includes('nausea') || text.includes('gastric') || text.includes('vomit')) {
    result = {
      possibleCondition: 'Gastritis / Gastroenteritis',
      explanation: 'An irritation or inflammation of the stomach lining, often triggered by food sensitivities, infections, or excessive acidity.',
      severityLevel: 'Moderate',
      recommendedSpecialty: 'Gastroenterologist',
      healthAdvice: 'Avoid spicy, greasy, or highly acidic foods. Drink plenty of clear fluids (like water or coconut water) in small, frequent sips. Consider bland meals like rice, bananas, and toast.'
    };
  } else if (text.includes('fever') || text.includes('cough') || text.includes('cold') || text.includes('throat') || text.includes('flu') || text.includes('congestion')) {
    result = {
      possibleCondition: 'Viral Respiratory Infection (Common Cold / Flu)',
      explanation: 'A viral infection targeting your upper respiratory tract, commonly causing fever, congestion, sore throat, and fatigue.',
      severityLevel: 'Mild',
      recommendedSpecialty: 'General Physician',
      healthAdvice: 'Stay warm, drink warm liquids, rest extensively, and use over-the-counter throat lozenges or saline nasal sprays. Monitor your temperature regularly.'
    };
  } else if (text.includes('rash') || text.includes('itching') || text.includes('skin') || text.includes('allergy') || text.includes('redness')) {
    result = {
      possibleCondition: 'Contact Dermatitis / Allergic Skin Reaction',
      explanation: 'Skin inflammation triggered by contact with an allergen or irritant, leading to itching, redness, or localized swelling.',
      severityLevel: 'Mild',
      recommendedSpecialty: 'Dermatologist',
      healthAdvice: 'Avoid scratching the affected area. Apply a cool, damp compress. Use a gentle, fragrance-free moisturizer. Avoid harsh soaps or known triggers.'
    };
  } else if (text.includes('joint') || text.includes('bone') || text.includes('back pain') || text.includes('knee') || text.includes('sprain') || text.includes('muscle pain')) {
    result = {
      possibleCondition: 'Musculoskeletal Strain / Joint Pain',
      explanation: 'Discomfort arising from muscle strain, ligament sprains, or joint wear-and-tear, often due to physical activity or posture.',
      severityLevel: 'Moderate',
      recommendedSpecialty: 'Orthopedic / Physiotherapist',
      healthAdvice: 'Use the R.I.C.E protocol (Rest, Ice, Compression, Elevation) for acute injuries. Apply heat for chronic stiffness. Avoid strenuous lifting.'
    };
  }

  return result;
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

const getSymptomCheck = async (symptoms, age, gender, duration, existingConditions) => {
  const prompt = getSymptomPrompt(symptoms, age, gender, duration, existingConditions);

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

  // Fallback to local clinical parser
  return runLocalClinicalFallback(symptoms, age, gender, duration, existingConditions);
};

const getChatFollowUp = async (assessment, message, chatHistory) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return 'AI chat is unavailable (no API key). Please consult a General Physician for follow-up questions.';
  }

  const systemPrompt = `You are an expert AI Medical Assistant specializing in follow-up consultation.
You are chatting with a patient about their recent symptom assessment:
- Symptoms reported: ${assessment.symptoms}
- Age/Gender: ${assessment.age} years old, ${assessment.gender}
- Duration: ${assessment.duration}
- Existing Conditions: ${assessment.existingConditions || 'None'}
- Assessment result: Possible Condition: ${assessment.aiAnalysis.possibleCondition}, Severity: ${assessment.aiAnalysis.severityLevel}, Specialty: ${assessment.aiAnalysis.recommendedSpecialty}.

Guidelines:
1. Be helpful, accurate, empathetic, and clear.
2. NEVER prescribe specific medications or dosages.
3. Keep answers concise (3-4 sentences max).
4. Remind the patient to consult a real doctor for an actual diagnosis.`;

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

  // Try each model in sequence until one succeeds
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

  // All models failed — give a sensible local response
  return `Based on your assessment of "${assessment.aiAnalysis.possibleCondition}", I recommend following the health advice provided in your report. For specific questions, please consult a ${assessment.aiAnalysis.recommendedSpecialty}. I'm currently unable to reach the AI service, but your report contains useful guidance.`;
};

module.exports = {
  getSymptomCheck,
  getChatFollowUp
};
