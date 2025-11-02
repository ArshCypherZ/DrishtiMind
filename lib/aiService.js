import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';

const genAI = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY || 'your-api-key-here'});

// Schema for perspective journal response
const perspectiveJournalSchema = {
  name: "generatePerspectiveJournalContent",
  description: "Generates journal entry from perspective session",
  parametersJsonSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      content: { type: "string" },
      summary: { type: "string" },
      mood_emoji: { 
        type: "string", 
        enum: ["😊", "😐", "😔", "😟", "🧠", "❤️", "✨", "😴", "😤", "🤔"] 
      },
      tags: {
        type: "array",
        items: { type: "string" },
        minItems: 3,
        maxItems: 4
      }
    },
    required: ["title", "content", "summary", "mood_emoji", "tags"]
  }
};

export async function generatePerspectiveJournalContent(sessionData) {
  try {
    const { userInput, quizzes, cards } = sessionData;
    
    const prompt = `
You are creating a personal journal entry based on a perspective session. Write this as if the person is reflecting on their experience.

Session Data:
- Original situation: "${userInput}"
- Quiz responses: ${JSON.stringify(quizzes, null, 2)}
- Insight cards: ${JSON.stringify(cards, null, 2)}

Create a realistic journal entry that:
1. **Title**: A personal, reflective title (max 50 characters) - something the person would actually write
2. **Content**: A natural journal entry (150-300 words) that:
   - Starts with the original situation in their own words
   - Incorporates insights from the cards naturally
   - Includes learnings from quiz responses
   - Uses first person ("I", "me", "my")
   - Sounds like a real person writing in their diary
   - Avoids overly formal or AI-like language
   - Focuses on personal reflection, not generic advice
3. **Summary**: A brief 1-2 sentence summary (max 100 characters)
4. **Mood Emoji**: Choose the most appropriate: 😊, 😐, 😔, 😟, 🧠, ❤️, ✨, 😴, 😤, 🤔
5. **Tags**: 3-4 tags where first is one of: "happy", "neutral", "sad", "other"

Return JSON:
{
  "title": "string",
  "content": "string", 
  "summary": "string",
  "mood_emoji": "string",
  "tags": ["string", "string", "string"]
}
`;

    // Generate structured response
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{
          functionDeclarations: [perspectiveJournalSchema]
        }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY
          }
        }
      }
    });
    
    // Get structured data from function call
    const generatedData = result.functionCalls[0].args;
    
    return {
      title: generatedData.title?.substring(0, 200) || 'Perspective Reflection',
      content: generatedData.content || 'Reflection on perspective session',
      summary: generatedData.summary?.substring(0, 100) || 'Gained new perspectives through guided reflection',
      mood_emoji: generatedData.mood_emoji || '🧠',
      tags: Array.isArray(generatedData.tags) ? generatedData.tags.slice(0, 4) : ['reflection', 'growth']
    };
    
  } catch (error) {
    console.error('Error generating perspective journal content:', error);
    
    return {
      title: `Reflection - ${new Date().toLocaleDateString()}`,
      content: `Reflection on: ${sessionData.userInput}\n\n${sessionData.cards.map(card => `Key insight: ${card.title} - ${card.content}`).join('\n\n')}\n\nThis helped me see things differently and gave me new ways to think about my situation.`,
      summary: 'Gained new perspectives through guided reflection',
      mood_emoji: '🧠',
      tags: ['reflection', 'growth']
    };
  }
}

export async function generateManualJournalContent(title, content) {
  try {
    const manualJournalSchema = {
      name: "generateManualJournalMetadata",
      description: "Generates metadata for a manual journal entry",
      parametersJsonSchema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          mood_emoji: { 
            type: "string", 
            enum: ["😊", "😐", "😔", "😟", "🧠", "❤️", "✨", "😴", "😤", "🤔"] 
          },
          tags: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 4
          }
        },
        required: ["summary", "mood_emoji", "tags"]
      }
    };
    
    const prompt = `
Analyze journal entry title "${title}" and content "${content}" to generate metadata.`;
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{
          functionDeclarations: [manualJournalSchema]
        }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY
          }
        }
      }
    });
    
    const generatedData = result.functionCalls[0].args;
    
    return {
      summary: generatedData.summary?.substring(0, 100) || content.substring(0, 100),
      mood_emoji: generatedData.mood_emoji || '😐',
      tags: Array.isArray(generatedData.tags) ? generatedData.tags.slice(0, 4) : ['personal']
    };
    
  } catch (error) {
    console.error('Error generating manual journal content:', error);
    return {
      summary: content.substring(0, 100),
      mood_emoji: '😐',
      tags: ['personal']
    };
  }
}

export async function generateSmartRecommendations(userMood, userHistory, currentContext) {
  try {
    const prompt = `
You are a wellness AI assistant. Generate 3 personalized recommendations for the user based on their current state.

User Context:
- Current mood: ${userMood ? `${userMood.mood_emoji} (${userMood.mood_rate}/10)` : 'Not set today'}
- Activity level: ${userHistory.sessions || 0} perspective sessions, ${userHistory.journals || 0} journal entries
- Current streak: ${userHistory.current_streak || 0} days
- Context: ${currentContext || 'General wellness'}

Generate recommendations that are:
1. Actionable and specific
2. Appropriate for their current mood
3. Focused on mental wellness and self-care
4. Brief but meaningful

Return JSON format:
{
  "recommendations": [
    {
      "title": "Activity name",
      "description": "Brief description of the activity", 
      "action": "Action button text",
      "type": "category" // mindfulness, reflection, wellness, social, creative
    }
  ]
}
`;

    const recommendationSchema = {
      name: "generateRecommendations",
      description: "Generates personalized wellness recommendations",
      parametersJsonSchema: {
        type: "object",
        properties: {
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                action: { type: "string" },
                type: { 
                  type: "string",
                  enum: ["mindfulness", "reflection", "wellness", "social", "creative"]
                }
              },
              required: ["title", "description", "action", "type"]
            },
            minItems: 3,
            maxItems: 3
          }
        },
        required: ["recommendations"]
      }
    };
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{
          functionDeclarations: [recommendationSchema]
        }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY
          }
        }
      }
    });
    
    const data = result.functionCalls[0].args;
    const recommendations = data.recommendations;
    
    return recommendations.recommendations || [];
    
  } catch (error) {
    console.error('Error generating smart recommendations:', error);
    return [];
  }
}

export async function analyzeDailyMood(moodData, journalData, sessionData) {
  try {
    const prompt = `
You are analyzing a user's daily emotional state to provide insights and mood scoring.

Daily Data:
- Mood emoji selected: ${moodData.mood_emoji || 'None'}
- Mood rating: ${moodData.mood_rate || 'Not provided'}/10
- Journal entries: ${journalData.length} entries
- Journal content: ${journalData.map(j => j.content.substring(0, 100)).join('; ')}
- Perspective sessions: ${sessionData.length} sessions
- Session content: ${sessionData.map(s => s.user_input.substring(0, 100)).join('; ')}

Analyze this data and provide:
1. Happiness score (1-10)
2. Sadness score (1-10) 
3. Anxiety score (1-10)
4. Energy score (1-10)
5. Loneliness score (1-10)
6. Overall wellness score (1-10)
7. Brief AI summary of the day (50 words max)

Return JSON:
{
  "happiness_score": number,
  "sadness_score": number,
  "anxiety_score": number,
  "energy_score": number,
  "loneliness_score": number,
  "overall_wellness": number,
  "ai_summary": "string",
  "key_insights": ["insight1", "insight2"]
}
`;

    const moodAnalysisSchema = {
      name: "analyzeDailyMood",
      description: "Analyzes daily emotional state to provide insights and scoring",
      parametersJsonSchema: {
        type: "object",
        properties: {
          happiness_score: { type: "number", minimum: 1, maximum: 10 },
          sadness_score: { type: "number", minimum: 1, maximum: 10 },
          anxiety_score: { type: "number", minimum: 1, maximum: 10 },
          energy_score: { type: "number", minimum: 1, maximum: 10 },
          loneliness_score: { type: "number", minimum: 1, maximum: 10 },
          overall_wellness: { type: "number", minimum: 1, maximum: 10 },
          ai_summary: { type: "string" },
          key_insights: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: [
          "happiness_score", "sadness_score", "anxiety_score", 
          "energy_score", "loneliness_score", "overall_wellness",
          "ai_summary", "key_insights"
        ]
      }
    };
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{
          functionDeclarations: [moodAnalysisSchema]
        }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY
          }
        }
      }
    });
    
    const analysis = result.functionCalls[0].args;
    
    return {
      happiness_score: Math.max(1, Math.min(10, analysis.happiness_score || 5)),
      sadness_score: Math.max(1, Math.min(10, analysis.sadness_score || 5)),
      anxiety_score: Math.max(1, Math.min(10, analysis.anxiety_score || 5)),
      energy_score: Math.max(1, Math.min(10, analysis.energy_score || 5)),
      loneliness_score: Math.max(1, Math.min(10, analysis.loneliness_score || 5)),
      overall_wellness: Math.max(1, Math.min(10, analysis.overall_wellness || 5)),
      ai_summary: analysis.ai_summary || 'A day of reflection and growth.',
      key_insights: analysis.key_insights || []
    };
    
  } catch (error) {
    console.error('Error analyzing daily mood:', error);
    
    return {
      happiness_score: 5,
      sadness_score: 5,
      anxiety_score: 5,
      energy_score: 5,
      loneliness_score: 5,
      overall_wellness: 5,
      ai_summary: 'Daily mood analysis',
      key_insights: []
    };
  }
}

export async function generateWeeklySummary(weeklyData) {
  try {
    const { dailySummaries, journals, perspectiveSessions, moods, weekStart, weekEnd } = weeklyData;
    
    const prompt = `
You are creating a comprehensive weekly wellness summary for a user. Analyze the entire week's data to provide insights and growth patterns.

Week Data:
- Period: ${weekStart.toDateString()} to ${weekEnd.toDateString()}
- Daily summaries: ${dailySummaries.length} days analyzed
- Journals: ${journals.length} entries
- Perspective sessions: ${perspectiveSessions.length} sessions
- Mood entries: ${moods.length} mood checks

Daily Summaries Data:
${dailySummaries.map(ds => `- ${ds.date.toDateString()}: ${ds.ai_summary} (Wellness: ${ds.overall_wellness}/10)`).join('\n')}

Journal Content:
${journals.map(j => `- ${j.date.toDateString()}: ${j.title} - ${j.content.substring(0, 100)}...`).join('\n')}

Perspective Sessions:
${perspectiveSessions.map(ps => `- ${ps.date.toDateString()}: ${ps.user_input.substring(0, 100)}...`).join('\n')}

Mood Data:
${moods.map(m => `- ${m.date.toDateString()}: ${m.mood_emoji} (${m.mood_rate}/10)`).join('\n')}

Based on this comprehensive week analysis, provide:

1. **Dominant Theme**: Main emotional pattern or topic of the week
2. **Growth Insights**: 3-4 key insights about personal growth, learning, or changes
3. **Achievement Highlights**: 2-3 specific accomplishments or positive moments
4. **Challenges Faced**: 2-3 difficulties or areas for improvement
5. **Short Summary**: 1-2 sentence summary (max 150 characters)
6. **Detailed Summary**: 3-4 paragraph comprehensive overview
7. **Recommendations**: 3-4 actionable suggestions for next week

Return JSON format:
{
  "dominant_theme": "string",
  "growth_insights": ["insight1", "insight2", "insight3"],
  "achievement_highlights": ["highlight1", "highlight2", "highlight3"],
  "challenges_faced": ["challenge1", "challenge2"],
  "short_summary": "string",
  "detailed_summary": "string",
  "recommendations": {"next_week": ["action1", "action2"], "wellness": ["tip1", "tip2"]}
}
`;

    const weeklySummarySchema = {
      name: "generateWeeklySummary",
      description: "Generates comprehensive weekly wellness summary with insights and recommendations",
      parametersJsonSchema: {
        type: "object",
        properties: {
          dominant_theme: { type: "string" },
          growth_insights: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 4
          },
          achievement_highlights: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 3
          },
          challenges_faced: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 3
          },
          short_summary: { type: "string" },
          detailed_summary: { type: "string" },
          recommendations: {
            type: "object",
            properties: {
              next_week: {
                type: "array",
                items: { type: "string" },
                minItems: 3,
                maxItems: 4
              },
              wellness: {
                type: "array",
                items: { type: "string" },
                minItems: 2,
                maxItems: 3
              }
            }
          }
        },
        required: [
          "dominant_theme", "growth_insights", "achievement_highlights",
          "challenges_faced", "short_summary", "detailed_summary", "recommendations"
        ]
      }
    };
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{
          functionDeclarations: [weeklySummarySchema]
        }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY
          }
        }
      }
    });
    
    const analysis = result.functionCalls[0].args;
    
    return {
      dominant_theme: analysis.dominant_theme || 'Self-reflection and growth',
      growth_insights: analysis.growth_insights || ['Consistent journaling pattern observed'],
      achievement_highlights: analysis.achievement_highlights || ['Completed weekly wellness routine'],
      challenges_faced: analysis.challenges_faced || ['Areas for improvement identified'],
      short_summary: analysis.short_summary || 'A week of personal wellness journey',
      detailed_summary: analysis.detailed_summary || 'This week involved regular self-reflection and wellness activities.',
      recommendations: analysis.recommendations || {
        next_week: ['Continue daily reflection practice', 'Focus on identified growth areas'],
        wellness: ['Maintain consistent sleep schedule', 'Practice mindfulness exercises']
      }
    };
    
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    
    return {
      dominant_theme: 'Self-reflection and growth',
      growth_insights: ['Consistent journaling pattern observed'],
      achievement_highlights: ['Completed weekly wellness routine'],
      challenges_faced: ['Areas for improvement identified'],
      short_summary: 'A week of personal wellness journey',
      detailed_summary: 'This week involved regular self-reflection and wellness activities.',
      recommendations: {
        next_week: ['Continue daily reflection practice', 'Focus on identified growth areas'],
        wellness: ['Maintain consistent sleep schedule', 'Practice mindfulness exercises']
      }
    };
  }
}

export async function generateMonthlySummary(monthlyData) {
  try {
    const { weeklySummaries, dailySummaries, journals, perspectiveSessions, moods, monthStart, monthEnd } = monthlyData;
    
    const prompt = `
You are creating a comprehensive monthly wellness summary for a user. Analyze the entire month's data including all weekly summaries to provide deep insights and long-term growth patterns.

Month Data:
- Period: ${monthStart.toDateString()} to ${monthEnd.toDateString()}
- Weekly summaries: ${weeklySummaries.length} weeks analyzed
- Daily summaries: ${dailySummaries.length} days analyzed
- Journals: ${journals.length} entries
- Perspective sessions: ${perspectiveSessions.length} sessions
- Mood entries: ${moods.length} mood checks

Weekly Summaries Analysis:
${weeklySummaries.map(ws => `- Week ${ws.week}: ${ws.short_summary} (Theme: ${ws.dominant_theme || 'Not specified'})`).join('\n')}

Daily Highlights:
${dailySummaries.slice(0, 10).map(ds => `- ${ds.date.toDateString()}: ${ds.ai_summary} (Wellness: ${ds.overall_wellness}/10)`).join('\n')}

Journal Content:
${journals.slice(0, 5).map(j => `- ${j.date.toDateString()}: ${j.title} - ${j.content.substring(0, 100)}...`).join('\n')}

Perspective Sessions:
${perspectiveSessions.slice(0, 5).map(ps => `- ${ps.date.toDateString()}: ${ps.user_input.substring(0, 100)}...`).join('\n')}

Mood Data:
${moods.slice(0, 10).map(m => `- ${m.date.toDateString()}: ${m.mood_emoji} (${m.mood_rate}/10)`).join('\n')}

Based on this comprehensive month analysis, provide:

1. **Dominant Theme**: Main emotional pattern or topic that defined the month
2. **Growth Insights**: 4-5 key insights about personal growth, learning, or behavioral changes over the month
3. **Achievement Highlights**: 3-4 significant accomplishments or positive moments from the month
4. **Challenges Faced**: 2-3 major difficulties or areas that need attention
5. **Short Summary**: 2-3 sentence monthly overview (max 200 characters)
6. **Detailed Summary**: 4-5 paragraph comprehensive monthly reflection
7. **Recommendations**: 4-5 actionable suggestions for the next month

Return JSON format:
{
  "dominant_theme": "string",
  "growth_insights": ["insight1", "insight2", "insight3", "insight4"],
  "achievement_highlights": ["highlight1", "highlight2", "highlight3", "highlight4"],
  "challenges_faced": ["challenge1", "challenge2", "challenge3"],
  "short_summary": "string",
  "detailed_summary": "string",
  "recommendations": {"next_month": ["action1", "action2", "action3", "action4"], "wellness": ["tip1", "tip2", "tip3"]}
}
`;

    const monthlySummarySchema = {
      name: "generateMonthlySummary",
      description: "Generates comprehensive monthly wellness summary with deep insights and long-term growth patterns",
      parametersJsonSchema: {
        type: "object",
        properties: {
          dominant_theme: { type: "string" },
          growth_insights: {
            type: "array",
            items: { type: "string" },
            minItems: 4,
            maxItems: 5
          },
          achievement_highlights: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 4
          },
          challenges_faced: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 3
          },
          short_summary: { type: "string" },
          detailed_summary: { type: "string" },
          recommendations: {
            type: "object",
            properties: {
              next_month: {
                type: "array",
                items: { type: "string" },
                minItems: 4,
                maxItems: 5
              },
              wellness: {
                type: "array",
                items: { type: "string" },
                minItems: 3,
                maxItems: 4
              }
            }
          }
        },
        required: [
          "dominant_theme", "growth_insights", "achievement_highlights",
          "challenges_faced", "short_summary", "detailed_summary", "recommendations"
        ]
      }
    };
    
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{
          functionDeclarations: [monthlySummarySchema]
        }],
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.ANY
          }
        }
      }
    });
    
    const analysis = result.functionCalls[0].args;
    
    return {
      dominant_theme: analysis.dominant_theme || 'Personal growth and self-discovery',
      growth_insights: analysis.growth_insights || ['Consistent self-reflection pattern established', 'Emotional awareness increased over time'],
      achievement_highlights: analysis.achievement_highlights || ['Maintained monthly wellness routine', 'Completed regular journaling practice'],
      challenges_faced: analysis.challenges_faced || ['Areas for continued improvement identified'],
      short_summary: analysis.short_summary || 'A month of meaningful personal growth and wellness journey',
      detailed_summary: analysis.detailed_summary || 'This month involved consistent self-reflection, wellness activities, and personal development.',
      recommendations: analysis.recommendations || {
        next_month: ['Continue daily reflection practice', 'Focus on identified growth areas', 'Maintain wellness routine', 'Explore new self-care techniques'],
        wellness: ['Maintain consistent sleep schedule', 'Practice mindfulness exercises', 'Regular physical activity']
      }
    };
    
  } catch (error) {
    console.error('Error generating monthly summary:', error);
    
    return {
      dominant_theme: 'Personal growth and self-discovery',
      growth_insights: ['Consistent self-reflection pattern established', 'Emotional awareness increased over time'],
      achievement_highlights: ['Maintained monthly wellness routine', 'Completed regular journaling practice'],
      challenges_faced: ['Areas for continued improvement identified'],
      short_summary: 'A month of meaningful personal growth and wellness journey',
      detailed_summary: 'This month involved consistent self-reflection, wellness activities, and personal development.',
      recommendations: {
        next_month: ['Continue daily reflection practice', 'Focus on identified growth areas', 'Maintain wellness routine', 'Explore new self-care techniques'],
        wellness: ['Maintain consistent sleep schedule', 'Practice mindfulness exercises', 'Regular physical activity']
      }
    };
  }
}
