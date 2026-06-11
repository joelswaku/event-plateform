import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = 'claude-sonnet-4-6';

export async function callClaude({ system, prompt, maxTokens = 1024 }) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: prompt }],
  });
  return msg.content[0].text;
}

export async function generateEventDescription({ title, type, date, location }) {
  return callClaude({
    system: 'You are an expert event copywriter. Write compelling, concise event descriptions in 2-3 sentences.',
    prompt: `Write a description for this event:
Title: ${title}
Type: ${type}
Date: ${date}
Location: ${location}`,
  });
}

export async function generateAttendeeEmail({ eventTitle, eventDate, eventLocation, emailType = 'confirmation' }) {
  return callClaude({
    system: 'You are a professional event email writer. Write clear, friendly emails.',
    prompt: `Write a ${emailType} email for:
Event: ${eventTitle}
Date: ${eventDate}
Location: ${eventLocation}`,
  });
}

export async function generateEventTags({ title, description, type }) {
  return callClaude({
    system: 'You are an SEO expert. Return only a JSON array of 5-8 relevant tags. No explanation.',
    prompt: `Generate tags for:
Title: ${title}
Type: ${type}
Description: ${description}

Return only: ["tag1", "tag2", "tag3"]`,
    maxTokens: 200,
  });
}
