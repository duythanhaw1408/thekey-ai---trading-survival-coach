
import { GoogleGenAI, Type, Chat } from '@google/genai';
// FIX: Added TraderArchetype and TraderArchetypeAnalysis to the type import list to support the new getTraderArchetype function.
import type { TradeDecision, Trade, TraderStats, ChatMessage, AppSettings, CheckinAnalysisResult, CheckinQuestion, DetectedPattern, WeeklyGoals, TradeAnalysis, CrisisData, WeeklyReport, DetectionResult, MarketAnalysis, ProcessStats, AiChatResponse, TraderArchetype, TraderArchetypeAnalysis } from '../types';
import { MarketDangerScoringEngine, PatternDetectionEngine } from './marketRadarService';
import { biofeedbackAnalyzer } from './biofeedbackService';
// Optimization Services
import { cacheService } from './cacheService';
import { modelRouter, type TaskType } from './modelRouter';
import { learningEngine } from './learningEngine';


// FIX: Use VITE_ prefix for environment variables in Vite projects
// @ts-ignore - Vite injects import.meta.env
const API_KEY = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY
    ? import.meta.env.VITE_GEMINI_API_KEY
    : process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.error("[GeminiService] VITE_GEMINI_API_KEY is not set. AI features will not work.");
}

const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;
const marketRadar = new MarketDangerScoringEngine();
const patternDetector = new PatternDetectionEngine();

/**
 * Helper to check if AI is available
 * Returns false if VITE_GEMINI_API_KEY is not set
 */
export const isAiAvailable = (): boolean => !!ai;

/**
 * Wrapper for AI calls with null safety
 * Throws a friendly error if AI is not available
 */
const ensureAiAvailable = (): GoogleGenAI => {
    if (!ai) {
        throw new Error('AI_NOT_AVAILABLE');
    }
    return ai;
};


const MASTER_SYSTEM_PROMPT = `You are THEKEY, an AI Survival Coach for cryptocurrency traders. Your PRIMARY mission is to help traders SURVIVE long enough to become skilled, NOT to maximize profits. You are a protective guardian, a compassionate mirror, and a patient mentor. You measure success in "days alive," not dollars earned. Your tone is empathetic, direct but kind, and honest without crushing hope. You communicate in simple Vietnamese, mixed with English technical terms. You NEVER give financial advice, predict markets, or promise profits. Your goal is to help the trader protect their capital, understand their own behavior, and build discipline. You will be provided with the user's current trading stats and recent history as context. Use this context to make your answers specific and personal, but do not simply repeat the data back to them. Instead, interpret it through the lens of a survival coach.`;

const JSON_QUOTE_RULE = `**JSON QUOTE RULE (ABSOLUTE & CRITICAL):** Every string value in your JSON output MUST be enclosed in double quotes. Inside any string value, you are FORBIDDEN from using the double quote character ("). If you need to include something that looks like a quote, you MUST either use single quotes (') or rephrase the sentence entirely to avoid it. Using backslash escapes (\\") is FORBIDDEN and will cause a critical error.
- **FATAL ERROR EXAMPLE:** \`{"reason": "Bạn đã vượt quá giới hạn "5 lệnh" mỗi ngày."}\`
- **CORRECT & VALID:** \`{"reason": "Bạn đã vượt quá giới hạn '5 lệnh' mỗi ngày."}\`
- **CORRECT & VALID:** \`{"reason": "Giới hạn 5 lệnh mỗi ngày của bạn đã bị vượt qua."}\`
This is the single most important rule. Failure to follow it will break the application.`;

function cleanAndParseJson<T>(rawText: string | undefined): T {
    if (!rawText) {
        throw new Error("Received empty response from AI");
    }
    let cleanedText = rawText.trim();
    if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.substring(7);
        if (cleanedText.endsWith('```')) {
            cleanedText = cleanedText.slice(0, -3);
        }
    } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.substring(3);
        if (cleanedText.endsWith('```')) {
            cleanedText = cleanedText.slice(0, -3);
        }
    }
    try {
        return JSON.parse(cleanedText) as T;
    } catch (error: any) {
        console.error("Failed to parse cleaned JSON:", cleanedText);
        // Re-throw the original error for better stack tracing, but with more context.
        throw new Error(`JSON parsing failed. Original error: ${error.message}`);
    }
}

const getDynamicSystemPrompt = (basePrompt: string, processStats: ProcessStats | null): string => {
    if (!processStats) {
        return basePrompt;
    }

    let dynamicInstruction = "\n\n**ADAPTIVE TONE INSTRUCTIONS:**";
    if (processStats.averageScore < 50) {
        dynamicInstruction += ` The user is currently struggling with their process (average score: ${processStats.averageScore}/100). Adopt a highly supportive, patient, and instructive tone. Focus on reinforcing basic rules and building confidence. Keep guidance simple and actionable. Their weakest area appears to be ${processStats.weakestArea}.`;
    } else if (processStats.averageScore > 80) {
        dynamicInstruction += ` The user is demonstrating strong process discipline (average score: ${processStats.averageScore}/100). Shift to a more collaborative, peer-level tone. You can introduce more advanced concepts related to process optimization and psychological fine-tuning.`;
    } else {
        dynamicInstruction += ` The user has a stable process (average score: ${processStats.averageScore}/100). Maintain a balanced tone of a supportive mentor. Reinforce good habits and gently guide them on their weakest area: ${processStats.weakestArea}.`;
    }
    return basePrompt + dynamicInstruction;
};


const getProtectionGuardianPrompt = (settings: AppSettings, activePattern: DetectedPattern | null, processStats: ProcessStats | null, marketAnalysis: MarketAnalysis | null) => {
    const basePrompt = `You are the Protection Guardian module of THEKEY. Your objective is to prevent traders from making decisions that will likely destroy their account. Evaluate the following trade request against ALL of the rules below. Your final decision must integrate the outcomes of all triggered rules.

**INTEGRATION LOGIC:**
1.  **BLOCKING PRECEDENCE:** If ANY rule results in a 'BLOCK', the final decision MUST be 'BLOCK'. The 'reason' must clearly state all reasons for the block.
2.  **WARNING INTEGRATION:** If multiple rules result in a 'WARN', the final decision is 'WARN'. The final 'reason' must summarize ALL warnings. The 'recommended_size' must be the MOST CONSERVATIVE (smallest) size suggested by any of the triggered rules.
3.  **ALLOWANCE:** Only if no rules trigger a 'BLOCK' or 'WARN' can the decision be 'ALLOW'.

**PROTECTION RULES:**
1.  **Revenge Trade Blocker**: If consecutive_losses >= 2, BLOCK the trade with a 1800-second (30 minutes) cooldown. This is a critical rule. The reason should be empathetic and explain the risk of revenge trading.
2.  **Overconfidence Guardrail**: If consecutive_wins >= 3 AND the new trade's positionSize is > 150 (3x the base limit of $50), issue a WARN. The reason must state the risk of overconfidence after a winning streak.
3.  **Stop-Loss Requirement**: If stopLoss is not provided or is zero, issue a WARN. The reason must explain that trading without a predefined stop-loss is one of the fastest ways to destroy an account.
4.  **Market Risk Adjuster**: If the market danger level is 'DANGEROUS' or 'EXTREME', issue a WARN and recommend reducing position size by 50% (e.g., recommend a size of $25 if base is $50). Your reason must mention the high-risk market conditions.
5.  **Position Size Guardian (Dynamic)**:
    - Base position size limit is 5% of an assumed $1000 account balance, so $50.
    - If consecutive_losses >= 2, this dynamic limit is REDUCED to 2% of the assumed balance, so $20.
    - **Pattern Adjustment**: If an active negative pattern is detected (e.g., 'revenge_trading', 'fomo'), reduce the current dynamic limit by a further 20% (e.g., $50 becomes $40, $20 becomes $16). You must mention this in your reason.
    - If the new trade's positionSize is > ${settings.positionSizeWarningThreshold}% of the CURRENT DYNAMIC limit (after all adjustments), BLOCK the trade. Provide the correct 'recommended_size'.
    - If the new trade's positionSize is between 100% and ${settings.positionSizeWarningThreshold}% of the CURRENT DYNAMIC limit, WARN them. Provide the correct 'recommended_size'.
    - Your reason must explain WHY the limit is what it is (e.g., "reduced due to recent losses" or "reduced due to active FOMO pattern").
6.  **Daily Trade Limiter**:
    - The base daily trade limit is ${settings.dailyTradeLimit}.
    - **Pattern Adjustment**: If an active negative pattern is detected, reduce this limit by 1 for today. Mention this adjustment.
    - If trades today >= the adjusted daily trade limit, BLOCK the trade with a 300-second (5 minutes) cooldown.
    - When blocking, you MUST analyze the provided trade history (today's trades only) to calculate and return a 'statistics' object with 'normal_winrate' and 'overtrade_winrate'.
    - The 'reason' MUST use this data to explain the block.
7.  **Green Light**: If no rules are broken, ALLOW the trade with an encouraging message about risk management.

Your response MUST be a perfectly valid JSON object that matches the provided schema. ${JSON_QUOTE_RULE} All text content must be in Vietnamese.
The user's active pattern is: ${activePattern ? activePattern.pattern_name : 'None'}. Apply adjustments if necessary.
Current market danger level: ${marketAnalysis?.danger_level || 'UNKNOWN'}. Apply adjustments if necessary.`;

    return getDynamicSystemPrompt(basePrompt, processStats);
};

const tradeDecisionSchema = {
    type: Type.OBJECT,
    properties: {
        decision: { type: Type.STRING, enum: ['ALLOW', 'WARN', 'BLOCK'] },
        reason: { type: Type.STRING },
        cooldown: { type: Type.INTEGER },
        statistics: {
            type: Type.OBJECT,
            properties: {
                overtrade_winrate: { type: Type.STRING },
                normal_winrate: { type: Type.STRING },
            },
        },
        recommended_size: { type: Type.NUMBER }
    },
    required: ['decision', 'reason'],
};

export const getTradeFeedback = async (
    trade: {
        asset: string;
        positionSize: number;
        reasoning: string;
        direction: 'BUY' | 'SELL';
        entryPrice: number;
        takeProfit?: number;
        stopLoss?: number;
    },
    stats: TraderStats,
    tradeHistory: Trade[],
    settings: AppSettings,
    activePattern: DetectedPattern | null,
    processStats: ProcessStats | null,
    marketAnalysis: MarketAnalysis | null
): Promise<TradeDecision> => {
    // Use modelRouter for intelligent model selection
    const model = modelRouter.getModelName('TRADE_FEEDBACK');

    const today = new Date().toDateString();
    const todaysTrades = tradeHistory.filter(t => new Date(t.timestamp).toDateString() === today);
    const tradesTodayCount = todaysTrades.length;

    const historyForPrompt = todaysTrades.map(t => ({ pnl: t.pnl, status: t.status, decision: t.decision }));

    const contextPrompt = `
    Current User Stats: 
    - Consecutive Losses: ${stats.consecutiveLosses}
    - Consecutive Wins: ${stats.consecutiveWins}
    - Trades Today Already: ${tradesTodayCount}
    - Active Behavioral Pattern: ${activePattern ? activePattern.pattern_name : 'None'}

    Current Market Conditions:
    - Danger Level: ${marketAnalysis ? marketAnalysis.danger_level : 'Unknown'}
    - AI Recommendation: ${marketAnalysis ? marketAnalysis.recommendation.action.replace('_', ' ') : 'Not available'}

    User's Custom Settings: - Daily Trade Limit: ${settings.dailyTradeLimit}
    New Trade Request: 
    - Direction: ${trade.direction}
    - Asset: ${trade.asset}
    - Entry Price: ${trade.entryPrice}
    - Take Profit: ${trade.takeProfit || 'Not set'}
    - Stop Loss: ${trade.stopLoss || 'Not set'}
    - Position Size: ${trade.positionSize} USD
    - User's Reasoning: "${trade.reasoning}"
    Today's Trade History (for statistical analysis if needed): ${JSON.stringify(historyForPrompt)}
    Evaluate this new request based on your rules and the user's settings.
  `;

    try {
        // FIX: Check if AI is available
        if (!ai) {
            console.warn("[GeminiService] AI not initialized - API key may be missing");
            return { decision: 'WARN', reason: 'AI services đang bảo trì. Vui lòng kiểm tra lại cài đặt và thử lại sau.', cooldown: 0 };
        }

        const response = await ai.models.generateContent({
            model,
            contents: contextPrompt,
            config: {
                systemInstruction: getProtectionGuardianPrompt(settings, activePattern, processStats, marketAnalysis),
                responseMimeType: 'application/json',
                responseSchema: tradeDecisionSchema,
                temperature: 0.3
            }
        });
        const decision = cleanAndParseJson<TradeDecision>(response.text);
        if (!['ALLOW', 'WARN', 'BLOCK'].includes(decision.decision)) throw new Error("Invalid decision from AI");
        return decision;
    } catch (error) {
        console.error("Error getting trade feedback from Gemini:", error);
        return { decision: 'BLOCK', reason: 'Đã xảy ra lỗi khi phân tích lệnh của bạn. Để đảm bảo an toàn, vui lòng thử lại sau.', cooldown: 60 };
    }
};

const QUESTION_GENERATOR_PROMPT = `You are THEKEY's Reflection Coach generating daily check-in questions. Your task is to create a valid JSON object containing EXACTLY 3 personalized daily check-in questions for a trader.

**CRITICAL RULES FOR A VALID JSON RESPONSE:**
1.  **EXACTLY 3 QUESTIONS**: The 'questions' array in your JSON output MUST contain exactly three objects. No more, no less.
2.  **VIETNAMESE ONLY**: All text content (questions, labels, options) MUST be in Vietnamese.
3.  **SCALE LABEL LENGTH**: Labels for scales ("min_label", "max_label") MUST be short (1-3 words). This is a critical rule to prevent UI breaking.
    - **CORRECT**: \`"min_label": "Rất bình tĩnh"\`
    - **FATAL ERROR**: \`"min_label": "Cảm thấy rất lo lắng và không chắc chắn..."\`
4.  **COMPLETE OBJECTS**: Each question object MUST be complete with all its required fields.
    - A 'scale' question MUST have 'min', 'max', 'min_label', and 'max_label'.
    - A 'multiple-choice' question MUST have an 'options' array with 4 strings.
5.  ${JSON_QUOTE_RULE}

**QUESTION STRUCTURE:**
- **Question 1 (ID "1")**: Must be about Emotional State (type: "scale").
- **Question 2 (ID "2")**: Must be about Behavior Recognition (type: "multiple-choice").
- **Question 3 (ID "3")**: Must be Forward-Looking and ask for a plan/intention (type: "text").

**YOUR OUTPUT MUST BE ONLY THE JSON OBJECT, matching this exact structure:**
\`\`\`json
{
  "questions": [
    {
      "id": "1",
      "text": "[Question 1: Ask about emotional state, e.g., confidence, calm, anxiety]",
      "type": "scale",
      "scale": {
        "min": 1,
        "max": 10,
        "min_label": "[Short label, 1-3 words]",
        "max_label": "[Short label, 1-3 words]"
      }
    },
    {
      "id": "2",
      "text": "[Question 2: Ask to identify a specific recent behavior, e.g., discipline, FOMO, patience]",
      "type": "multiple-choice",
      "multiple_choice": {
        "options": [
          "Option A: A positive, disciplined behavior",
          "Option B: A common negative behavior (e.g., FOMO)",
          "Option C: Another common negative behavior (e.g., cutting profits short)",
          "Option D: A neutral or patient behavior"
        ]
      }
    },
    {
      "id": "3",
      "text": "[Question 3: Ask about one specific goal or focus for the upcoming session]",
      "type": "text"
    }
  ]
}
\`\`\`
Before outputting, verify your response is a single, valid JSON object containing a 'questions' array with exactly three complete question objects.`;

export const getDailyCheckinQuestions = async (tradeHistory: Trade[]): Promise<CheckinQuestion[]> => {
    const model = modelRouter.getModelName('CHECKIN_ANALYSIS');
    const recentTrades = tradeHistory.slice(0, 5);
    const content = `User's recent trade history for context (don't mention it directly, just use it to personalize the questions):\n${JSON.stringify(recentTrades, null, 2)}`;

    const fallbackQuestions: CheckinQuestion[] = [
        { id: "1", text: "Trên thang điểm từ 1-10, bạn cảm thấy tự tin như thế nào khi đưa ra các quyết định của mình hôm nay?", type: 'scale', scale: { min: 1, max: 10, min_label: "Rất lo lắng", max_label: "Rất tự tin" } },
        { id: "2", text: "Hành vi nào mô tả rõ nhất cách bạn thực hiện kỷ luật trong phiên hôm nay?", type: 'multiple-choice', multiple_choice: { options: ["Tuân thủ hoàn toàn kế hoạch đã đề ra.", "Vào lệnh do cảm xúc hoặc sợ lỡ cơ hội (FOMO).", "Chốt lời hoặc cắt lỗ quá sớm so với dự kiến.", "Kiên nhẫn chờ đợi và không vào lệnh sai setup."] } },
        { id: "3", text: "Một bài học nhỏ nào bạn muốn áp dụng cho phiên giao dịch ngày mai?", type: 'text' }
    ];

    try {
        const response = await ai.models.generateContent({
            model,
            contents: content,
            config: {
                systemInstruction: QUESTION_GENERATOR_PROMPT,
                responseMimeType: 'application/json',
                temperature: 0.2,
                maxOutputTokens: 2048,
                thinkingConfig: { thinkingBudget: 400 },
            }
        });
        const parsed = cleanAndParseJson<{ questions: CheckinQuestion[] }>(response.text);

        if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length !== 3) {
            console.warn("AI response for questions is not an array of 3. Falling back.", parsed);
            return fallbackQuestions;
        }

        const areQuestionsValid = parsed.questions.every(q => {
            if (!q || !q.id || !q.text || !q.type) return false;
            if (q.type === 'scale') {
                return q.scale && typeof q.scale.min === 'number' && typeof q.scale.max === 'number' && typeof q.scale.min_label === 'string' && typeof q.scale.max_label === 'string';
            }
            if (q.type === 'multiple-choice') {
                return q.multiple_choice && Array.isArray(q.multiple_choice.options) && q.multiple_choice.options.length > 0;
            }
            if (q.type === 'text') {
                return true;
            }
            return false;
        });

        if (!areQuestionsValid) {
            console.warn("AI returned structurally invalid questions. Falling back.", parsed.questions);
            return fallbackQuestions;
        }

        return parsed.questions;
    } catch (error) {
        console.error("Error generating daily questions, using fallback:", error);
        return fallbackQuestions;
    }
}

const REFLECTION_COACH_PROMPT = `You are the Reflection Coach module of THEKEY. Your goal is to guide traders to self-awareness by analyzing their daily check-in answers.
Your analysis framework:
1. IDENTIFY CORE THEMES: Look for emotional, behavioral, and cognitive patterns.
2. CONNECT DOTS: Link their feelings to their stated intentions and potential actions.
3. GENERATE INSIGHTS: Provide one key insight, two small action items, and genuine encouragement.
Your response MUST be a perfectly valid JSON object that matches the provided schema. ${JSON_QUOTE_RULE} All text content must be in Vietnamese.
- "insights": ONE powerful, non-judgmental observation about their current mindset.
- "action_items": TWO specific, small, concrete actions for their next trading session.
- "encouragement": A genuine recognition of their effort for doing the check-in.
- "reflection_question": An optional, gentle, open-ended question to help them think deeper.
Your tone must be empathetic and focus on discovery, not instruction.`;

const checkinAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        insights: { type: Type.STRING },
        action_items: { type: Type.ARRAY, items: { type: Type.STRING } },
        encouragement: { type: Type.STRING },
        reflection_question: { type: Type.STRING },
    },
    required: ['insights', 'action_items', 'encouragement']
}

export const getCheckinAnalysis = async (answers: string[], questions: string[]): Promise<CheckinAnalysisResult> => {
    const model = modelRouter.getModelName('CHECKIN_ANALYSIS');
    const content = `User's Daily Check-in Answers:\n${questions.map((q, i) => `Q: ${q}\nA: ${answers[i]}`).join('\n\n')}\nAnalyze these answers based on your system prompt.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: content,
            config: {
                systemInstruction: REFLECTION_COACH_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: checkinAnalysisSchema,
                temperature: 0.7,
            },
        });
        return cleanAndParseJson<CheckinAnalysisResult>(response.text);
    } catch (error) {
        console.error("Error getting checkin analysis from Gemini:", error);
        return {
            encouragement: "Cảm ơn bạn đã check-in. Giữ vững tinh thần và kỷ luật nhé!",
            insights: "Dữ liệu của bạn đã được ghi nhận. Hãy tiếp tục quan sát các khuôn mẫu của mình.",
            action_items: ["Uống một ly nước trước khi vào lệnh đầu tiên.", "Xem lại kế hoạch giao dịch của bạn."]
        };
    }
}

const chatResponseSchema = {
    type: Type.OBJECT,
    properties: {
        display_text: { type: Type.STRING },
        internal_reasoning: { type: Type.STRING },
    },
    required: ['display_text', 'internal_reasoning']
};

export const getChatResponse = async (
    uxMode: 'COACH' | 'PROTECTOR',
    messages: ChatMessage[],
    stats: TraderStats,
    tradeHistory: Trade[],
    processStats: ProcessStats | null
): Promise<AiChatResponse> => {
    const model = modelRouter.getModelName('CHAT_RESPONSE');

    const latestMessage = messages[messages.length - 1];
    if (latestMessage.sender !== 'user' || latestMessage.type !== 'text') {
        throw new Error("Last message must be a text message from the user to get a response.");
    }

    const context = `
    --- START OF CONTEXT ---
    Here is the current state of the trader you are coaching. Use this to inform your response.
    Current UX Mode: ${uxMode}. ${uxMode === 'PROTECTOR' ? 'You must be extremely direct, protective, and firm.' : 'You should be a supportive, empathetic coach.'}
    
    Current Stats:
    - Survival Days: ${stats.survivalDays}
    - Discipline Score: ${stats.disciplineScore}%
    - Consecutive Losses: ${stats.consecutiveLosses}

    Recent Trade History (last 10):
    ${tradeHistory.slice(0, 10).map(t =>
        `- ${t.asset} | Size: $${t.positionSize} | Status: ${t.status} | PnL: ${t.pnl?.toFixed(2) || 'N/A'} | Decision: ${t.decision}`
    ).join('\n') || 'No trades yet.'}
    --- END OF CONTEXT ---

    PREVIOUS CONVERSATION:
    ${messages.slice(-10, -1).map(m => m.type === 'text' ? `${m.sender.toUpperCase()}: ${m.text}` : '').join('\n')}

    USER'S NEW MESSAGE:
    ${latestMessage.text}
    `;

    const systemInstruction = getDynamicSystemPrompt(MASTER_SYSTEM_PROMPT, processStats);

    try {
        const response = await ai.models.generateContent({
            model,
            contents: context,
            config: {
                systemInstruction,
                temperature: 0.7,
                responseMimeType: 'application/json',
                responseSchema: chatResponseSchema
            }
        });
        return cleanAndParseJson<AiChatResponse>(response.text);
    } catch (error) {
        console.error("Error getting chat response:", error);
        return { display_text: "Xin lỗi, tôi đang gặp sự cố kỹ thuật.", internal_reasoning: "Falled back due to API error." };
    }
};

export const getInitialMessage = (): string => {
    return `Chào mừng bạn đến với THEKEY AI. 
    
Nhiệm vụ của tôi là giúp bạn tồn tại đủ lâu trên thị trường để trở nên thành thạo.

Tôi sẽ là người đồng hành, giúp bạn:
- **Bảo vệ** tài khoản khỏi những quyết định cảm tính.
- **Phản ánh** các khuôn mẫu hành vi của chính bạn.
- **Tiến bộ** mỗi ngày qua việc rèn luyện kỷ luật.

Hãy bắt đầu bằng cách nhập một lệnh vào Trade Terminal để tôi phân tích.`;
}

const QUICK_INSIGHT_PROMPT = `You are THEKEY's quick insight generator. Based on the following stats from the last 30 trades, provide a concise, encouraging, and actionable insight (2-3 sentences) in Vietnamese. Focus on behavior and discipline.

Stats:
- Total Trades: {total}
- Disciplined Trades: {disciplined}% (Allowed + Warned)
- Blocked by AI: {blocked}

Your insight should be a single string, not JSON.`;

export const getProgressInsight = async (stats: { total: number; disciplined: number; blocked: number; }): Promise<string> => {
    if (stats.total === 0) {
        return "Chưa có dữ liệu giao dịch để phân tích. Hãy thực hiện một vài giao dịch để bắt đầu!";
    }
    const model = modelRouter.getModelName('CHAT_RESPONSE');
    const prompt = QUICK_INSIGHT_PROMPT
        .replace('{total}', String(stats.total))
        .replace('{disciplined}', String(Math.round(stats.disciplined)))
        .replace('{blocked}', String(stats.blocked));

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                systemInstruction: MASTER_SYSTEM_PROMPT,
                temperature: 0.7,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting progress insight:", error);
        return "Rất tiếc, tôi không thể tạo thông tin chi tiết vào lúc này.";
    }
}

const PATTERN_NARRATIVE_PROMPT = `You are THEKEY's Pattern Analyst explaining a detected behavioral pattern. Your task is to explain this pattern to the user in a way that shows concrete evidence from THEIR trades, explains the psychology behind it in simple terms, quantifies the impact, and suggests specific actions to break it. Your tone must be curious and exploratory, not accusatory. Your response MUST be a perfectly valid JSON object that matches the provided schema. ${JSON_QUOTE_RULE} All text content must be in Vietnamese.`;

const patternSchema = {
    type: Type.OBJECT,
    properties: {
        pattern_name: { type: Type.STRING },
        summary: { type: Type.STRING },
        evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
        impact: { type: Type.STRING },
        psychology: { type: Type.STRING },
        breaking_strategy: { type: Type.ARRAY, items: { type: Type.STRING } },
        success_metric: { type: Type.STRING },
    },
    required: ['pattern_name', 'summary', 'evidence', 'impact', 'psychology', 'breaking_strategy', 'success_metric'],
};

export const getDetectedPattern = async (tradeHistory: Trade[], marketAnalysis: MarketAnalysis | null): Promise<DetectedPattern> => {
    const model = modelRouter.getModelName('PATTERN_DETECTION');
    const detectionResults: DetectionResult[] = patternDetector.detect(tradeHistory, marketAnalysis);

    if (detectionResults.length === 0) {
        return {
            pattern_name: "Không tìm thấy khuôn mẫu rõ ràng",
            summary: "Hiện tại, AI không phát hiện thấy một khuôn mẫu hành vi tiêu cực nào nổi bật trong lịch sử giao dịch gần đây của bạn. Đây là một dấu hiệu tốt cho thấy sự kỷ luật.",
            evidence: [],
            impact: "Tiếp tục duy trì sự nhất quán.",
            psychology: "Khi một trader không bị chi phối bởi các khuôn mẫu cảm tính, họ có thể đưa ra quyết định dựa trên chiến lược và phân tích một cách khách quan hơn.",
            breaking_strategy: ["Tiếp tục thực hành check-in hàng ngày.", "Luôn xác định rủi ro trước mỗi lệnh."],
            success_metric: "Duy trì điểm kỷ luật trên 85%."
        }
    }

    // For now, focus on the most confident pattern
    const topPattern = detectionResults.sort((a, b) => b.confidence - a.confidence)[0];

    const content = `
    The internal PatternDetectionEngine has detected the following pattern with high confidence:
    - Pattern ID: ${topPattern.patternId}
    - Confidence: ${topPattern.confidence.toFixed(2)}
    - Severity: ${topPattern.severity}
    - Key Evidence from user data: ${JSON.stringify(topPattern.evidence.indicators)}

    Based on this, generate a user-facing narrative explanation.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: content,
            config: {
                systemInstruction: PATTERN_NARRATIVE_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: patternSchema,
                temperature: 0.6,
            }
        });
        return cleanAndParseJson<DetectedPattern>(response.text);
    } catch (error) {
        console.error("Error narrating detected pattern:", error);
        throw new Error("Could not generate pattern explanation.");
    }
};

const WEEKLY_GOAL_GENERATION_PROMPT = `You are THEKEY's Progress Mentor generating weekly goals. Your task is to generate exactly 2 goals for the next week that will move the trader forward from their current level.
CRITICAL RULES:
1. Match Level Appropriately: SURVIVAL -> Focus on protection; STABILIZING -> Focus on habits; GROWING -> Focus on optimization.
2. Build on Last Week: Reference their data, especially the 'Identified issues' section, to justify the goals. Look for patterns like:
    - **Overtrading**: Suggest a goal to reduce daily/weekly trade frequency.
    - **Revenge Trading**: Suggest a goal to enforce a "cool-down" period after every loss.
    - **Overconfidence**: Suggest a goal to maintain consistent position sizing after wins.
    - **Poor Risk Management**: Suggest goals related to stop-loss adherence or position sizing.
3. **Incorporate Check-in Insights**: Use the themes from their daily check-ins to make goals more personal and relevant to their emotional/behavioral state.
4. Make It Measurable & Behavioral: Not "Trade better," but "Follow stop-loss on 10/10 trades." Not "Make $500," but "Wait for confirmation on every entry."
5. Your response MUST be a perfectly valid JSON object that matches the provided schema. ${JSON_QUOTE_RULE}
6. All text must be in Vietnamese.`;

const weeklyGoalSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        metric: { type: Type.STRING },
        target: { type: Type.STRING },
        daily_checkpoint: { type: Type.STRING },
        connection_to_last_week: { type: Type.STRING },
    },
    required: ['id', 'title', 'description', 'metric', 'target', 'daily_checkpoint', 'connection_to_last_week'],
}

const weeklyGoalsSchema = {
    type: Type.OBJECT,
    properties: {
        week_number: { type: Type.INTEGER },
        user_level: { type: Type.STRING, enum: ['SURVIVAL', 'STABILIZING', 'GROWING'] },
        primary_goal: weeklyGoalSchema,
        secondary_goal: weeklyGoalSchema,
        rationale: { type: Type.STRING },
        success_definition: { type: Type.STRING },
    },
    required: ['week_number', 'user_level', 'primary_goal', 'secondary_goal', 'rationale', 'success_definition'],
}

export const getWeeklyGoals = async (tradeHistory: Trade[], stats: TraderStats, checkinHistory: CheckinAnalysisResult[]): Promise<WeeklyGoals> => {
    const model = modelRouter.getModelName('WEEKLY_GOALS');
    const weekNumber = Math.floor(stats.survivalDays / 7) + 1;
    const recentTrades = tradeHistory.slice(0, 30);
    const userLevel = stats.survivalDays < 14 ? 'SURVIVAL' : stats.disciplineScore < 70 ? 'STABILIZING' : 'GROWING';

    const analyzeTradePatternsForGoals = (trades: Trade[], currentStats: TraderStats) => {
        if (trades.length < 5) return "Not enough data for deep analysis.";

        const issues = new Set<string>();
        const tradesByDay: { [key: string]: number } = {};

        trades.forEach(t => {
            const date = new Date(t.timestamp).toDateString();
            tradesByDay[date] = (tradesByDay[date] || 0) + 1;
        });

        if (Object.values(tradesByDay).some(count => count > 5)) {
            issues.add("Potential overtrading on some days.");
        }

        for (let i = 0; i < trades.length - 1; i++) {
            const currentTrade = trades[i];
            const prevTrade = trades[i + 1]; // History is reversed in state

            if (prevTrade.pnl && prevTrade.pnl < 0) {
                const timeDiff = new Date(currentTrade.timestamp).getTime() - new Date(prevTrade.timestamp).getTime();
                if (timeDiff < 10 * 60 * 1000) { // 10 minutes
                    issues.add("Possible revenge trading (entering new trades too quickly after a loss).");
                }
            }

            if (prevTrade.pnl && prevTrade.pnl > 0) {
                if (currentTrade.positionSize > prevTrade.positionSize * 1.5 && currentTrade.positionSize > 100) {
                    issues.add("Possible overconfidence (significantly increasing size after a win).");
                }
            }
        }

        if (issues.size === 0) {
            return currentStats.consecutiveLosses > 1 ? 'Prone to loss streaks.' : 'Generally disciplined.';
        }

        return Array.from(issues).join(' ');
    }

    const identifiedIssues = analyzeTradePatternsForGoals(recentTrades, stats);

    const content = `
    USER CLASSIFICATION:
    - Level: ${userLevel}
    - Days active: ${stats.survivalDays}
    - Consecutive Losses: ${stats.consecutiveLosses}
    - Discipline Score: ${stats.disciplineScore}%

    LAST WEEK ANALYSIS (based on last 30 trades):
    - Trades: ${recentTrades.length}
    - Rule compliance: ${stats.disciplineScore}%
    - Identified issues: ${identifiedIssues}
    - What went well: ${stats.disciplineScore > 80 ? 'High rule compliance.' : 'Survived another week.'}

    RECENT CHECK-IN INSIGHTS (use these themes to personalize goals):
    ${checkinHistory.map(c => `- ${c.insights}`).join('\n') || 'No check-in history available.'}

    Generate weekly goals based on all this data.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: content,
            config: {
                systemInstruction: WEEKLY_GOAL_GENERATION_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: weeklyGoalsSchema,
                temperature: 0.7,
            },
        });
        return cleanAndParseJson<WeeklyGoals>(response.text);
    } catch (error) {
        console.error("Error generating weekly goals:", error);
        return {
            week_number: weekNumber,
            user_level: "STABILIZING",
            primary_goal: {
                id: "fallback_goal_1",
                title: "Thực thi Stop-Loss Hoàn hảo",
                description: "Tập trung vào việc tuân thủ stop-loss 100% để bảo vệ vốn và xây dựng kỷ luật.",
                metric: "Tỷ lệ tuân thủ Stop-loss",
                target: "100% (tất cả các lệnh)",
                daily_checkpoint: "Trước mỗi lệnh: 'Tôi đã đặt stop-loss chưa và tôi có cam kết tuân thủ nó không?'",
                connection_to_last_week: "Xây dựng thói quen kỷ luật cốt lõi."
            },
            secondary_goal: {
                id: "fallback_goal_2",
                title: "Ghi nhật ký sau mỗi giao dịch",
                description: "Ghi lại lý do vào lệnh, cảm xúc và kết quả để tìm ra các khuôn mẫu.",
                metric: "Số lượng nhật ký giao dịch",
                target: "1 nhật ký cho mỗi giao dịch",
                daily_checkpoint: "Sau khi đóng lệnh: 'Tôi đã ghi lại bài học từ lệnh này chưa?'",
                connection_to_last_week: "Tăng cường khả năng tự nhận thức."
            },
            rationale: "Tuần này, chúng tôi tập trung vào hai thói quen nền tảng: bảo vệ vốn (stop-loss) và học hỏi (nhật ký). Nắm vững những điều này sẽ tạo ra một nền tảng vững chắc cho sự phát triển trong tương lai.",
            success_definition: "Thành công trong tuần này được định nghĩa bằng việc tuân thủ các quy trình, không phải bằng lợi nhuận."
        };
    }
}

const MARKET_NARRATIVE_PROMPT = `You are THEKEY's Market Context Analyzer. The internal radar has calculated a market danger score. Your job is to translate this score into a human-readable, actionable narrative for a trader.
CRITICAL RULES:
1. DO NOT predict price direction. Your focus is RISK.
2. Use the provided 'danger_score' and 'primary_risks' as the source of truth.
3. Your response MUST be a perfectly valid JSON object containing only 'headline', 'recommendation'. ${JSON_QUOTE_RULE}
4. All text must be in Vietnamese.
5. The recommendation object must contain 'action', 'position_adjustment', 'stop_adjustment', and 'rationale'.`;

const marketNarrativeSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING },
        recommendation: {
            type: Type.OBJECT,
            properties: {
                action: { type: Type.STRING, enum: ['TRADE_NORMAL', 'REDUCE_SIZE', 'TRADE_SMALL', 'STAY_OUT'] },
                position_adjustment: { type: Type.STRING },
                stop_adjustment: { type: Type.STRING },
                rationale: { type: Type.STRING },
            },
            required: ['action', 'position_adjustment', 'stop_adjustment', 'rationale'],
        },
    },
    required: ['headline', 'recommendation'],
};

export const getMarketAnalysis = async (): Promise<MarketAnalysis> => {
    const model = modelRouter.getModelName('MARKET_ANALYSIS');
    const dangerReport = marketRadar.calculateScore();

    const content = `
    MARKET DANGER REPORT (from internal engine):
    - Danger Score: ${dangerReport.score}
    - Danger Level: ${dangerReport.level}
    - Primary Risk Factors: ${dangerReport.primaryRisks.map(r => r.factor).join(', ')}
    
    Generate the narrative parts ('headline' and 'recommendation') for this report.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: content,
            config: {
                systemInstruction: MARKET_NARRATIVE_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: marketNarrativeSchema,
                temperature: 0.5,
            },
        });
        const narrative = cleanAndParseJson<{ headline: string, recommendation: any }>(response.text);

        const color_map = { 'SAFE': '🟢', 'CAUTION': '🟡', 'DANGEROUS': '🟠', 'EXTREME': '🔴' };

        return {
            danger_level: dangerReport.level,
            danger_score: dangerReport.score,
            color_code: color_map[dangerReport.level],
            headline: narrative.headline,
            risk_factors: dangerReport.primaryRisks,
            factors: dangerReport.factors,
            recommendation: narrative.recommendation,
        }

    } catch (error) {
        console.error("Error getting market analysis narrative:", error);
        return {
            danger_level: 'CAUTION',
            danger_score: 45,
            color_code: '🟡',
            headline: "Không thể lấy dữ liệu thị trường trực tiếp.",
            risk_factors: [{
                factor: "Lỗi API",
                severity: "HIGH",
                description: "Không thể kết nối với dịch vụ phân tích thị trường. Dữ liệu có thể không chính xác.",
            }],
            factors: {
                volatility: 45,
                liquidity: 50,
                leverage: 60,
                sentiment: 30,
                events: 10,
            },
            recommendation: {
                action: 'REDUCE_SIZE',
                position_adjustment: "Giảm 50% khối lượng giao dịch.",
                stop_adjustment: "Không có đề xuất.",
                rationale: "Khi không có dữ liệu thị trường đáng tin cậy, việc giảm rủi ro là hành động phòng thủ tốt nhất."
            }
        };
    }
}

const POST_TRADE_ANALYSIS_PROMPT = `You are the Learning Journal Analyst module of THEKEY. Your goal is to extract concrete, actionable lessons from every trade. Analyze the provided trade data to identify behavioral patterns and process errors.

CRITICAL RULES:
1.  Focus on BEHAVIOR, not market randomness. Your analysis must be consistent with the provided trade data.
2.  THE PNL IS IRRELEVANT TO PROCESS QUALITY. A winning trade with a bad process (e.g., no clear setup, breaking rules) MUST be classified as "BAD_PROCESS" or "LUCKY". A losing trade that followed all rules perfectly MUST be classified as "GOOD_PROCESS". Your primary job is to critique the PROCESS, not the OUTCOME.
3.  A "GOOD_PROCESS" trade is one that follows a clear plan, respects risk management, and is executed without emotional interference.
4.  A "BAD_PROCESS" trade is one that is impulsive, breaks rules, or lacks a clear, predefined setup.
5.  Lessons must be SPECIFIC and ACTIONABLE.
6.  Be empathetic but direct.
7.  Your response MUST be a perfectly valid JSON object that matches the provided schema. ${JSON_QUOTE_RULE}
8.  All text must be in Vietnamese.
9.  If the user provides a self-evaluation, you MUST comment on it. Compare their self-perception with the objective data of the trade. Gently highlight any discrepancies or affirm accurate self-awareness in your 'classification_reason' or a new 'lesson'.`;

const tradeAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        trade_classification: { type: Type.STRING, enum: ["GOOD_PROCESS", "BAD_PROCESS", "LUCKY", "UNLUCKY"] },
        classification_reason: { type: Type.STRING },
        pattern_match: {
            type: Type.OBJECT,
            properties: {
                pattern_detected: { type: Type.STRING },
                confidence: { type: Type.NUMBER },
                evidence: { type: Type.STRING },
            },
            required: ['pattern_detected', 'confidence', 'evidence']
        },
        lessons: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    lesson_id: { type: Type.STRING },
                    category: { type: Type.STRING, enum: ["ENTRY", "EXECUTION", "RISK", "EMOTION"] },
                    lesson: { type: Type.STRING },
                    why_it_matters: { type: Type.STRING },
                    next_time_action: { type: Type.STRING },
                    guardrail_suggestion: { type: Type.STRING },
                },
                required: ['lesson_id', 'category', 'lesson', 'why_it_matters', 'next_time_action', 'guardrail_suggestion']
            }
        },
        if_you_could_redo: { type: Type.STRING },
        positive_takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
        journal_entry_suggestion: { type: Type.STRING },
    },
    required: ['trade_classification', 'classification_reason', 'pattern_match', 'lessons', 'if_you_could_redo', 'positive_takeaways', 'journal_entry_suggestion']
};

export const getPostTradeAnalysis = async (trade: Trade, tradeHistory: Trade[]): Promise<TradeAnalysis> => {
    const model = modelRouter.getModelName('POST_TRADE_ANALYSIS');

    let userEvalContext = 'User has not provided a self-evaluation for this trade.';
    if (trade.userProcessEvaluation) {
        const u = trade.userProcessEvaluation;
        userEvalContext = `
    USER'S 7-STEP SELF-EVALUATION:
    - Step 2 (Setup Clarity): ${u.setupClarity}/10
    - Step 3 (Planning): Had predefined Entry (${u.hadPredefinedEntry}), SL (${u.hadPredefinedSL}), TP (${u.hadPredefinedTP})
    - Step 4 (Risk): Adherence to position sizing rules: ${u.followedPositionSizing}/10
    - Step 5 (Execution): Adherence to plan: ${u.planAdherence}/10. Freedom from impulsive actions: ${u.impulsiveActions}/10.
    - Step 6 (Emotion): Dominant emotion was ${u.dominantEmotion}. Emotional influence on decisions: ${u.emotionalInfluence}/10.
    - Step 7 (Reflection): "${u.reflection}"
    `;
    }

    const context = `
    TRADE DATA TO ANALYZE:
    - Symbol: ${trade.asset}
    - Size: ${trade.positionSize} USD
    - User's Setup/Reason for Entry: "${trade.reasoning || 'No reason provided.'}"
    - AI Pre-trade Decision: ${trade.decision}
    - Outcome: ${trade.pnl !== undefined ? (trade.pnl >= 0 ? 'WIN' : 'LOSS') : 'UNKNOWN (Focus on process)'}

    ${userEvalContext}

    TRADER HISTORY (last 10 trades for context):
    ${tradeHistory.slice(0, 10).map(t => `- ${t.asset}: ${t.decision}`).join('\n')}
    
    Analyze this trade based on all provided data.
    `;
    try {
        const response = await ai.models.generateContent({
            model,
            contents: context,
            config: {
                systemInstruction: POST_TRADE_ANALYSIS_PROMPT,
                responseMimeType: "application/json",
                responseSchema: tradeAnalysisSchema,
                temperature: 0.6,
            },
        });
        return cleanAndParseJson<TradeAnalysis>(response.text);
    } catch (error) {
        console.error("Error getting post-trade analysis:", error);
        throw new Error("Failed to analyze trade.");
    }
}


const CRISIS_INTERVENTION_PROMPT = `You are THEKEY's Crisis Manager. A trader is in a high-risk emotional state. Generate a Crisis Intervention object.
CRITICAL RULES:
1. Your response MUST be a perfectly valid JSON object. ${JSON_QUOTE_RULE}
2. All text must be in Vietnamese.
3. The level is determined by consecutive losses: 2 losses = LEVEL_3, 3+ losses = LEVEL_4.
4. Generate concise, actionable content for each field.
5. If Bio-Correlation data is provided, you MUST use it to create a powerful, empathetic 'bioInsight' string explaining the mind-body connection to the user. If not provided, omit the field.`;

const crisisDataSchema = {
    type: Type.OBJECT,
    properties: {
        level: { type: Type.STRING, enum: ['LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4'] },
        reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
        userMetrics: {
            type: Type.OBJECT,
            properties: {
                winRateAfterLoss: { type: Type.NUMBER },
                normalWinRate: { type: Type.NUMBER },
                revengeTradeLoss: { type: Type.NUMBER },
                emotionalLevel: { type: Type.NUMBER },
            },
            required: ['winRateAfterLoss', 'normalWinRate', 'revengeTradeLoss', 'emotionalLevel']
        },
        recommendedActions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    icon: { type: Type.STRING },
                    actionType: { type: Type.STRING, enum: ['BREATHING', 'JOURNALING', 'EDUCATION'] }
                },
                required: ['id', 'title', 'description', 'duration', 'icon', 'actionType']
            }
        },
        estimatedRisk: { type: Type.NUMBER },
        cooldownMinutes: { type: Type.NUMBER },
        bioInsight: { type: Type.STRING },
    },
    required: ['level', 'reasons', 'userMetrics', 'recommendedActions', 'estimatedRisk', 'cooldownMinutes']
};

export const getEmotionalTiltIntervention = async (stats: TraderStats, tradeHistory: Trade[]): Promise<CrisisData> => {
    const model = modelRouter.getModelName('CRISIS_INTERVENTION');

    const bioAnalysis = await biofeedbackAnalyzer.analyzeCorrelation(tradeHistory);

    const context = `
    USER DATA:
    - Consecutive Losses: ${stats.consecutiveLosses}
    - Recent Losing Trades: ${JSON.stringify(tradeHistory.filter(t => (t.pnl ?? 0) < 0).slice(0, stats.consecutiveLosses))}
    - Bio-Correlation Analysis: ${bioAnalysis.correlationFound ? `Insight: ${bioAnalysis.insight}. Evidence: ${bioAnalysis.evidence}` : "No correlation found."}

    Generate a complete Crisis Intervention object. Set level based on consecutive losses (2=LEVEL_3, 3+=LEVEL_4).
    If a bio-correlation insight is available, craft a 'bioInsight' message for the user.
    `;
    try {
        const response = await ai.models.generateContent({
            model,
            contents: context,
            config: {
                systemInstruction: CRISIS_INTERVENTION_PROMPT,
                responseMimeType: "application/json",
                responseSchema: crisisDataSchema,
                temperature: 0.7,
            },
        });
        const interventionData = cleanAndParseJson<CrisisData>(response.text);
        return interventionData;
    } catch (error) {
        console.error("Error getting emotional tilt intervention:", error);
        throw new Error("Failed to generate crisis intervention.");
    }
}

const PERFORMANCE_REPORTER_PROMPT = `You are THEKEY's Performance Reporter. Your objective is to transform raw trading data into an insightful, narrative-driven weekly summary.
CRITICAL REQUIREMENTS:
1. LEAD WITH BEHAVIOR, NOT PnL.
2. Use a narrative structure: context, events, meaning, next steps.
3. Personalize insights by connecting data to patterns.
4. Balance celebration of behavioral wins with identification of 1-2 growth areas.
5. Provide specific, actionable recommendations.
6. Your response MUST be a perfectly valid JSON object that matches the provided schema. ${JSON_QUOTE_RULE}
7. All text must be in Vietnamese.`;

const weeklyReportSchema = {
    type: Type.OBJECT,
    properties: {
        report_period: { type: Type.STRING },
        report_type: { type: Type.STRING, enum: ['WEEKLY'] },
        executive_summary: {
            type: Type.OBJECT,
            properties: {
                headline: { type: Type.STRING },
                main_takeaway: { type: Type.STRING },
                overall_grade: { type: Type.STRING, enum: ['A', 'B+', 'B', 'C+', 'C', 'D', 'F'] },
                grade_explanation: { type: Type.STRING },
            },
            required: ['headline', 'main_takeaway', 'overall_grade', 'grade_explanation'],
        },
        behavioral_performance: {
            type: Type.OBJECT,
            properties: {
                highlight: { type: Type.STRING },
                lowlight: { type: Type.STRING },
                compliance_score: { type: Type.INTEGER },
                trend: { type: Type.STRING, enum: ['IMPROVING', 'STABLE', 'DECLINING'] },
                detailed_analysis: { type: Type.STRING },
            },
            required: ['highlight', 'lowlight', 'compliance_score', 'trend', 'detailed_analysis'],
        },
        financial_performance: {
            type: Type.OBJECT,
            properties: {
                pnl_context: { type: Type.STRING },
                quality_of_wins: { type: Type.STRING },
                quality_of_losses: { type: Type.STRING },
                efficiency_metrics: { type: Type.STRING },
            },
            required: ['pnl_context', 'quality_of_wins', 'quality_of_losses', 'efficiency_metrics'],
        },
        goal_progress: {
            type: Type.OBJECT,
            properties: {
                goals_set_last_week: { type: Type.ARRAY, items: { type: Type.STRING } },
                achievement_status: { type: Type.ARRAY, items: { type: Type.STRING } },
                what_worked: { type: Type.STRING },
                goal_adjustment_recommendation: { type: Type.STRING },
            },
            required: ['goals_set_last_week', 'achievement_status', 'what_worked', 'goal_adjustment_recommendation'],
        },
        pattern_evolution: {
            type: Type.OBJECT,
            properties: {
                patterns_overcome: { type: Type.STRING },
                patterns_persisting: { type: Type.STRING },
                new_patterns_watch: { type: Type.STRING },
            },
            required: ['patterns_overcome', 'patterns_persisting', 'new_patterns_watch'],
        },
        weekly_highlights: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    highlight: { type: Type.STRING },
                    significance: { type: Type.STRING },
                    evidence: { type: Type.STRING },
                },
                required: ['highlight', 'significance', 'evidence'],
            },
        },
        key_learning: {
            type: Type.OBJECT,
            properties: {
                main_lesson: { type: Type.STRING },
                how_to_apply: { type: Type.STRING },
            },
            required: ['main_lesson', 'how_to_apply'],
        },
        recommendations_for_next_week: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    priority: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
                    recommendation: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    expected_impact: { type: Type.STRING },
                },
                required: ['priority', 'recommendation', 'rationale', 'expected_impact'],
            },
        },
        encouragement: {
            type: Type.OBJECT,
            properties: {
                progress_made: { type: Type.STRING },
                perspective: { type: Type.STRING },
                forward_look: { type: Type.STRING },
            },
            required: ['progress_made', 'perspective', 'forward_look'],
        },
        raw_data_summary: { type: Type.STRING },
    },
    required: [
        'report_period', 'report_type', 'executive_summary', 'behavioral_performance',
        'financial_performance', 'goal_progress', 'pattern_evolution', 'weekly_highlights',
        'key_learning', 'recommendations_for_next_week', 'encouragement', 'raw_data_summary'
    ],
};


export const getWeeklyReport = async (tradeHistory: Trade[]): Promise<WeeklyReport> => {
    const model = modelRouter.getModelName('WEEKLY_REPORT');

    // Data aggregation
    const total_trades = tradeHistory.length;
    const wins = tradeHistory.filter(t => (t.pnl ?? 0) > 0).length;
    const losses = tradeHistory.filter(t => (t.pnl ?? 0) < 0).length;
    const net_pnl = tradeHistory.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const compliance_score = total_trades > 0
        ? (tradeHistory.filter(t => t.decision !== 'BLOCK').length / total_trades) * 100
        : 100;

    const context = `
    REPORTING PERIOD: Last 7 days
    TRADING ACTIVITY:
    - Total trades: ${total_trades}
    - Winning trades: ${wins}
    - Losing trades: ${losses}
    - Net PnL: $${net_pnl.toFixed(2)}
    BEHAVIORAL METRICS:
    - Rule compliance: ${Math.round(compliance_score)}%
    
    Generate a comprehensive weekly report based on this data.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: context,
            config: {
                systemInstruction: PERFORMANCE_REPORTER_PROMPT,
                responseMimeType: "application/json",
                responseSchema: weeklyReportSchema,
                temperature: 0.6,
            }
        });
        return cleanAndParseJson<WeeklyReport>(response.text);
    } catch (error) {
        console.error("Error generating weekly report:", error);
        throw new Error("Failed to generate weekly report.");
    }
}

// FIX: Added getTraderArchetype function to resolve export error.
const TRADER_ARCHETYPE_PROMPT = `You are THEKEY's Archetype Analyst. Your goal is to analyze a trader's history and self-reported check-ins to determine their core trading archetype.
Analyze the provided data based on these definitions:
- ANALYTICAL_TRADER: Focuses on data, technicals, and clear setups. Their reasoning is often detailed.
- EMOTIONAL_TRADER: Actions are often correlated with recent losses (revenge trading) or wins (overconfidence). Check-ins might reveal high emotional states.
- SYSTEMATIC_TRADER: Follows rules strictly. High discipline score. May trade less but with high consistency.
- UNDEFINED: Not enough data or mixed signals.

CRITICAL RULES:
1. Your response MUST be a perfectly valid JSON object that matches the provided schema. ${JSON_QUOTE_RULE}
2. All text for 'rationale' must be in Vietnamese.
3. The 'archetype' must be one of the specified enum values.
`;

const traderArchetypeSchema = {
    type: Type.OBJECT,
    properties: {
        archetype: { type: Type.STRING, enum: ['ANALYTICAL_TRADER', 'EMOTIONAL_TRADER', 'SYSTEMATIC_TRADER', 'UNDEFINED'] },
        rationale: { type: Type.STRING },
    },
    required: ['archetype', 'rationale']
};

export const getTraderArchetype = async (tradeHistory: Trade[], checkinHistory: CheckinAnalysisResult[]): Promise<TraderArchetypeAnalysis> => {
    const model = modelRouter.getModelName('ARCHETYPE');
    const recentTrades = tradeHistory.slice(0, 30);
    const recentCheckins = checkinHistory.slice(0, 5);

    if (recentTrades.length < 10) {
        return {
            archetype: 'UNDEFINED',
            rationale: 'Không đủ dữ liệu giao dịch để phân tích chính xác. Cần thêm ít nhất 10 giao dịch đã đóng.'
        };
    }

    const context = `
    USER DATA TO ANALYZE FOR ARCHETYPE:
    - Recent Trades (summary): ${JSON.stringify(recentTrades.map(t => ({ reasoning: t.reasoning, decision: t.decision, pnl: t.pnl, statsAtEntry: t.statsAtEntry })))}
    - Recent Check-in Insights: ${JSON.stringify(recentCheckins.map(c => c.insights))}

    Determine the user's archetype based on this data.
    `;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: context,
            config: {
                systemInstruction: TRADER_ARCHETYPE_PROMPT,
                responseMimeType: "application/json",
                responseSchema: traderArchetypeSchema,
                temperature: 0.5,
            }
        });
        return cleanAndParseJson<TraderArchetypeAnalysis>(response.text);
    } catch (error) {
        console.error("Error getting trader archetype:", error);
        throw new Error("Failed to get trader archetype.");
    }
};
