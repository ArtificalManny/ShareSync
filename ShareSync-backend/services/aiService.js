// backend/services/aiService.js
// ═══════════════════════════════════════════════════════════════════════════════
// Priority 3.1: AI Service for Smart Start
// Wraps Claude API call with structured output parsing + rate limiting
// Uses native fetch (Node 18+) — zero new dependencies
//
// SAFETY:
// - Returns FALLBACK suggestions if no API key configured
// - Rate limited (5 req/min per user)
// - All errors caught gracefully
// - No sensitive data logged
// ═══════════════════════════════════════════════════════════════════════════════

// ── Simple in-memory rate limiter ────────────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 5;        // requests per window
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(userId) {
  const key = String(userId);
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(key, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW * 2) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);

// ── Fallback suggestions (when no API key) ───────────────────────────────
function getFallbackSuggestions(description) {
  const desc = String(description || '').toLowerCase();

  // Basic keyword matching for relevant fallbacks
  const isMobile = desc.includes('mobile') || desc.includes('app') || desc.includes('ios') || desc.includes('android');
  const isWeb = desc.includes('web') || desc.includes('site') || desc.includes('dashboard') || desc.includes('landing');
  const isAPI = desc.includes('api') || desc.includes('backend') || desc.includes('server');

  let tasks;
  if (isMobile) {
    tasks = [
      { title: 'Set up mobile project scaffolding', description: 'Initialize the project with proper structure and navigation', priority: 'high', estimatedHours: 4, category: 'setup' },
      { title: 'Design core screen wireframes', description: 'Sketch the 3-5 main screens users will interact with', priority: 'high', estimatedHours: 6, category: 'design' },
      { title: 'Implement authentication flow', description: 'Login, signup, and token management', priority: 'high', estimatedHours: 8, category: 'code' },
      { title: 'Build main feature screen', description: 'The primary screen where users spend most time', priority: 'medium', estimatedHours: 12, category: 'code' },
      { title: 'Add push notifications', description: 'Set up notification infrastructure and key alerts', priority: 'medium', estimatedHours: 6, category: 'code' },
      { title: 'Write integration tests', description: 'Cover critical user flows with automated tests', priority: 'low', estimatedHours: 8, category: 'testing' },
    ];
  } else if (isAPI) {
    tasks = [
      { title: 'Design API schema and endpoints', description: 'Plan the REST/GraphQL API structure', priority: 'high', estimatedHours: 4, category: 'planning' },
      { title: 'Set up server and database', description: 'Initialize Express/NestJS with MongoDB/Postgres', priority: 'high', estimatedHours: 4, category: 'setup' },
      { title: 'Implement authentication middleware', description: 'JWT tokens, session management, role-based access', priority: 'high', estimatedHours: 8, category: 'code' },
      { title: 'Build core CRUD endpoints', description: 'Create, read, update, delete for primary resources', priority: 'high', estimatedHours: 12, category: 'code' },
      { title: 'Add input validation and error handling', description: 'Sanitize inputs, structured error responses', priority: 'medium', estimatedHours: 6, category: 'code' },
      { title: 'Write API documentation', description: 'Swagger/OpenAPI docs for all endpoints', priority: 'low', estimatedHours: 4, category: 'docs' },
    ];
  } else {
    tasks = [
      { title: 'Define project scope and goals', description: 'Write a clear 1-page brief of what success looks like', priority: 'high', estimatedHours: 2, category: 'planning' },
      { title: 'Set up project repository and tooling', description: 'Initialize repo, linting, CI/CD, folder structure', priority: 'high', estimatedHours: 3, category: 'setup' },
      { title: 'Create design mockups', description: 'Visual designs for the core user experience', priority: 'high', estimatedHours: 8, category: 'design' },
      { title: 'Build MVP core feature', description: 'Implement the single most important feature first', priority: 'high', estimatedHours: 16, category: 'code' },
      { title: 'Set up deployment pipeline', description: 'Get a staging environment running for testing', priority: 'medium', estimatedHours: 4, category: 'devops' },
      { title: 'Gather initial user feedback', description: 'Share with 3-5 people and collect structured feedback', priority: 'medium', estimatedHours: 4, category: 'research' },
    ];
  }

  return {
    tasks,
    timeline: '2-3 weeks',
    suggestedView: isAPI ? 'list' : 'board',
    milestones: [
      { title: 'Foundation Complete', description: 'Project scaffolding and core setup done', weekNumber: 1 },
      { title: 'Core Feature Ready', description: 'Primary functionality working end-to-end', weekNumber: 2 },
      { title: 'MVP Launch', description: 'Ready for first users or stakeholder review', weekNumber: 3 },
    ]
  };
}

// ── Claude API call ──────────────────────────────────────────────────────
async function callClaudeAPI(description, persona) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.log('[AI Service] No ANTHROPIC_API_KEY set — returning fallback suggestions');
    return getFallbackSuggestions(description);
  }

  const systemPrompt = `You are a project planning assistant for ShareSync, a project management app. 
Given a project description, generate a structured project plan.

RESPOND ONLY WITH VALID JSON (no markdown, no backticks, no explanation). The JSON must match this exact schema:
{
  "tasks": [
    {
      "title": "string (clear, actionable task title)",
      "description": "string (1-2 sentence description)",
      "priority": "high" | "medium" | "low",
      "estimatedHours": number,
      "category": "planning" | "design" | "code" | "testing" | "devops" | "docs" | "research" | "setup"
    }
  ],
  "timeline": "string (e.g. '2 weeks', '1 month')",
  "suggestedView": "board" | "list" | "timeline",
  "milestones": [
    {
      "title": "string",
      "description": "string",
      "weekNumber": number
    }
  ]
}

Rules:
- Generate 5-8 tasks, ordered by priority then dependency
- Tasks should be specific and actionable, not vague
- Estimate hours realistically for a solo developer or small team
- Include 2-4 milestones
- Timeline should be realistic
${persona ? `- The user's work style is: ${persona}` : ''}`;

  const userMessage = `Generate a project plan for: ${description}`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const data = await response.json();

  // Extract text from response
  const textBlock = data.content?.find(b => b.type === 'text');
  if (!textBlock?.text) {
    throw new Error('No text in Claude response');
  }

  // Parse JSON — strip markdown fences if present
  let raw = textBlock.text.trim();
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  const parsed = JSON.parse(raw);

  // Validate structure
  if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) {
    throw new Error('Invalid response structure: missing tasks array');
  }

  return {
    tasks: parsed.tasks.slice(0, 10).map(t => ({
      title: String(t.title || '').slice(0, 200),
      description: String(t.description || '').slice(0, 500),
      priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
      estimatedHours: Math.min(Math.max(Number(t.estimatedHours) || 2, 0.5), 100),
      category: String(t.category || 'code').slice(0, 50)
    })),
    timeline: String(parsed.timeline || '2-3 weeks').slice(0, 50),
    suggestedView: ['board', 'list', 'timeline'].includes(parsed.suggestedView) ? parsed.suggestedView : 'board',
    milestones: Array.isArray(parsed.milestones) ? parsed.milestones.slice(0, 5).map(m => ({
      title: String(m.title || '').slice(0, 200),
      description: String(m.description || '').slice(0, 500),
      weekNumber: Math.min(Math.max(Number(m.weekNumber) || 1, 1), 52)
    })) : []
  };
}

// ── Exported function ────────────────────────────────────────────────────
async function generateProjectPlan(userId, description, persona) {
  // Rate limit check
  if (!checkRateLimit(userId)) {
    const err = new Error('Rate limit exceeded. Please wait a minute before trying again.');
    err.statusCode = 429;
    throw err;
  }

  // Validate input
  if (!description || String(description).trim().length < 5) {
    const err = new Error('Description must be at least 5 characters.');
    err.statusCode = 400;
    throw err;
  }

  try {
    const result = await callClaudeAPI(
      String(description).trim().slice(0, 2000),
      persona ? String(persona).slice(0, 200) : null
    );
    return result;
  } catch (err) {
    console.error('[AI Service] Claude API failed, using fallback:', err.message);
    // Return fallback on any failure so the feature still works
    return getFallbackSuggestions(description);
  }
}

module.exports = { generateProjectPlan, getFallbackSuggestions };
