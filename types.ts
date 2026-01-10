
// Section 1: Core App State & Data
export interface TraderStats {
    survivalDays: number;
    drawdownControl: number; // percentage
    disciplineScore: number; // percentage
    consecutiveLosses: number;
    consecutiveWins: number;
}

// User's self-evaluation from the 7-step Process Dojo
export interface UserProcessEvaluation {
    // Step 2: Setup Clarity
    setupClarity: number; // 1-10

    // Step 3: Planning Quality
    hadPredefinedEntry: boolean;
    hadPredefinedSL: boolean;
    hadPredefinedTP: boolean;

    // Step 4: Risk Management
    followedPositionSizing: number; // 1-10

    // Step 5: Execution Adherence
    planAdherence: number; // 1-10 (Entry & Exit)
    impulsiveActions: number; // 1-10 (1 = many, 10 = none)

    // Step 6: Emotional State
    // How much did emotions drive your decisions? 1=Not at all, 10=Completely
    emotionalInfluence: number;
    dominantEmotion: 'PATIENCE' | 'CONFIDENCE' | 'FEAR' | 'GREED' | 'FOMO' | 'NEUTRAL';

    // Step 7: Key Lesson
    reflection: string;
}


export interface Trade {
    id: number;
    timestamp: Date;
    asset: string;
    direction: 'BUY' | 'SELL';
    entryPrice?: number;
    takeProfit?: number;
    stopLoss?: number;
    positionSize: number;
    status: 'OPEN' | 'CLOSED';
    decision: TradeDecision['decision'];
    pnl?: number; // PnL is optional for open trades, but required for closed ones.
    reasoning?: string; // User's reason for entering
    decisionReason?: string;
    mode: 'LIVE' | 'SIMULATION';
    statsAtEntry?: { // Snapshot of stats when trade was opened
        consecutiveLosses: number;
        consecutiveWins: number;
    };
    processEvaluation?: ProcessEvaluation;
    userProcessEvaluation?: UserProcessEvaluation;
}

export type TradeDecision = {
    decision: 'ALLOW' | 'WARN' | 'BLOCK';
    reason: string;
    cooldown?: number; // in seconds
    statistics?: {
        overtrade_winrate: string;
        normal_winrate: string;
    };
    recommended_size?: number;
};

export interface AppSettings {
    dailyTradeLimit: number;
    positionSizeWarningThreshold: number; // percentage
    maxPositionSizeUSD?: number;          // Absolute USD limit
    riskPerTradePct?: number;             // % Risk per trade
}

export type TraderArchetype = 'ANALYTICAL_TRADER' | 'EMOTIONAL_TRADER' | 'SYSTEMATIC_TRADER' | 'UNDEFINED';

export interface UserProfile {
    id: string;
    email?: string;
    isPro?: boolean;
    accountBalance: number;
    xp?: number;
    level?: string; // MasteryLevel title (e.g., 'NOVICE', 'SURVIVOR')
    archetype: TraderArchetype;
    tradingRules: AppSettings;
    protectionLevel: 'SURVIVAL' | 'DISCIPLINE' | 'FLEXIBLE';
    cooldownMinutes: number;
    consecutiveLossLimit: number;
    notificationPreferences: {
        pushEnabled: boolean;
        emailEnabled: boolean;
        smsEnabled: boolean;
        quietHours: { start: string, end: string };
    };
    sleepSchedule: { start: string, end: string };
}


// Section 2: Daily Check-in
export type QuestionType = 'scale' | 'multiple-choice' | 'text';

export interface ScaleDetails {
    min: number;
    max: number;
    min_label: string;
    max_label: string;
}

export interface MultipleChoiceDetails {
    options: string[];
}

export interface CheckinQuestion {
    id: string;
    text: string;
    type: QuestionType;
    scale?: ScaleDetails;
    multiple_choice?: MultipleChoiceDetails;
}

export interface CheckinAnalysisResult {
    insights: string;
    action_items: string[];
    encouragement: string;
    reflection_question?: string;
}


export type ChatMessage = {
    id: number;
    sender: 'user' | 'ai';
} & ({
    type: 'text';
    text: string;
} | {
    type: 'analysis';
    analysis: CheckinAnalysisResult;
});


// Section 3: AI & Analysis

export type UxMode = 'COACH' | 'GUARD' | 'PROTECTOR' | 'MIRROR' | 'ACK';

export interface AiChatResponse {
    display_text: string;
    internal_reasoning: string;
}

export interface DetectedPattern {
    pattern_name: string;
    summary: string;
    evidence: string[];
    impact: string;
    psychology: string;
    breaking_strategy: string[];
    success_metric: string;
}

export interface TraderArchetypeAnalysis {
    archetype: TraderArchetype;
    rationale: string;
}

export interface WeeklyGoal {
    id: string;
    title: string;
    description: string;
    metric: string;
    target: string;
    daily_checkpoint: string;
    connection_to_last_week: string;
}

export interface WeeklyGoals {
    week_number: number;
    user_level: 'SURVIVAL' | 'STABILIZING' | 'GROWING';
    primary_goal: WeeklyGoal;
    secondary_goal: WeeklyGoal;
    rationale: string;
    success_definition: string;
}

export interface PostTradeAnalysisLesson {
    lesson_id: string;
    category: "ENTRY" | "EXECUTION" | "RISK" | "EMOTION";
    lesson: string;
    why_it_matters: string;
    next_time_action: string;
    guardrail_suggestion: string;
}

export interface TradeAnalysis {
    trade_classification: "GOOD_PROCESS" | "BAD_PROCESS" | "LUCKY" | "UNLUCKY";
    classification_reason: string;
    pattern_match: {
        pattern_detected: string | null;
        confidence: number;
        evidence: string;
    };
    lessons: PostTradeAnalysisLesson[];
    if_you_could_redo: string;
    positive_takeaways: string[];
    journal_entry_suggestion: string;
}


export interface CrisisData {
    level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3' | 'LEVEL_4';
    reasons: string[];
    userMetrics: {
        winRateAfterLoss: number;
        normalWinRate: number;
        revengeTradeLoss: number;
        emotionalLevel: number;
    };
    recommendedActions: {
        id: string;
        title: string;
        description: string;
        duration: string;
        icon: string;
        actionType: 'BREATHING' | 'JOURNALING' | 'EDUCATION';
    }[];
    estimatedRisk: number;
    cooldownMinutes: number;
    bioInsight?: string;
}

export interface WeeklyReport {
    report_period: string;
    report_type: 'WEEKLY';
    executive_summary: {
        headline: string;
        main_takeaway: string;
        overall_grade: 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
        grade_explanation: string;
    };
    behavioral_performance: {
        highlight: string;
        lowlight: string;
        compliance_score: number;
        trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
        detailed_analysis: string;
    };
    financial_performance: {
        pnl_context: string;
        quality_of_wins: string;
        quality_of_losses: string;
        efficiency_metrics: string;
    };
    goal_progress: {
        goals_set_last_week: any[];
        achievement_status: any[];
        what_worked: string;
        goal_adjustment_recommendation: string;
    };
    pattern_evolution: {
        patterns_overcome: string;
        patterns_persisting: string;
        new_patterns_watch: string;
    };
    weekly_highlights: any[];
    key_learning: {
        main_lesson: string;
        how_to_apply: string;
    };
    recommendations_for_next_week: {
        priority: 'HIGH' | 'MEDIUM' | 'LOW';
        recommendation: string;
        rationale: string;
    }[];
    encouragement: {
        progress_made: string;
        perspective: string;
        forward_look: string;
    };
    raw_data_summary: string;
}


// Section 4: External Services & Notifications

// Market Radar
export interface DangerScore {
    score: number;
    level: 'SAFE' | 'CAUTION' | 'DANGEROUS' | 'EXTREME';
    factors: {
        volatility: number;
        liquidity: number;
        leverage: number;
        sentiment: number;
        events: number;
    };
    primaryRisks: {
        factor: string;
        severity: 'HIGH' | 'CRITICAL';
        description: string;
    }[];
    recommendations: {
        action: 'REDUCE_SIZE' | 'HEDGE' | 'STAY_OUT';
        priority: 'HIGH' | 'MEDIUM';
        description: string;
    }[];
}

export interface MarketAnalysis {
    danger_level: DangerScore['level'];
    danger_score: number;
    color_code: string;
    headline: string;
    risk_factors: DangerScore['primaryRisks'];
    factors: DangerScore['factors'];
    recommendation: {
        action: 'TRADE_NORMAL' | 'REDUCE_SIZE' | 'TRADE_SMALL' | 'STAY_OUT';
        position_adjustment: string;
        stop_adjustment: string;
        rationale: string;
    };
}


// Pattern Detection
export interface DetectionResult {
    patternId: 'REVENGE_TRADING' | 'OVERCONFIDENCE' | 'FOMO';
    confidence: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    evidence: {
        indicators: Record<string, any>;
        riskScore: number;
    };
    recommendations: string[];
}


// Notifications
// Note: This is a simplified version for the notification service; the main UserProfile is now the source of truth.
export interface NotificationPreferences {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    quietHours: { start: string, end: string };
}

export interface EmotionalState {
    primary: 'NEUTRAL' | 'FRUSTRATED' | 'PANIC' | 'EUPHORIC';
    level: number; // 1-10
    triggers: string[];
}

export type NotificationContext = {
    type: 'REVENGE_BLOCK' | 'DANGER_ALERT' | 'SUCCESS_CELEBRATION';
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
    marketData?: {
        volatility: number;
        dangerScore: number;
    };
}

export interface NotificationAction {
    id: string;
    label: string;
    action: string; // e.g., 'OPEN_JOURNAL'
}

export interface Notification {
    id: string;
    type: NotificationContext['type'];
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    body: string;
    actions: NotificationAction[];
    metadata: {
        emotionalState: EmotionalState;
        optimalDeliveryTime: number; // timestamp
        tone: string;
    };
    deliveryMethods: Array<'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS'>;
}


// Biofeedback
export interface BiofeedbackDataPoint {
    timestamp: number;
    hrv: number; // Heart Rate Variability
    heartRate: number; // Resting Heart Rate
    sleepScore: number;
}

export interface BioCorrelationAnalysis {
    correlationFound: boolean;
    insight: string;
    evidence: string;
}

// Section 5: Mastery & Progress
export type MasteryLevel = 'NOVICE' | 'APPRENTICE' | 'JOURNEYMAN' | 'MASTER' | 'GRANDMASTER';

export interface UnlockedContent {
    id: string;
    levelRequired: MasteryLevel;
    title: string;
    summary: string;
    type: 'ARTICLE' | 'VIDEO_LESSON' | 'TOOL';
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    metric: string;
    target: number;
    progress: number;
    status: 'ACTIVE' | 'COMPLETED';
    rewardXp: number;
}

export interface MasteryData {
    level: MasteryLevel;
    levelTitle: string;
    xp: number;
    xpToNextLevel: number;
    unlockedContent: UnlockedContent[];
    quests: Quest[];
}

// Anonymous Pods
export interface PodMessage {
    id: string;
    sender: 'You' | 'Peer 1' | 'Peer 2' | 'Peer 3';
    text: string;
    timestamp: number;
}

export interface Pod {
    id: string;
    name: string;
    members: string[];
    messages: PodMessage[];
}

// Section 6: Process Dojo & Shadow Metrics
export interface ProcessEvaluation {
    totalProcessScore: number; // 0-100
    scores: {
        setup: number;      // 1-10
        risk: number;       // 1-10
        emotion: number;    // 1-10
        execution: number;  // 1-10
    };
    weakestArea: 'SETUP' | 'RISK' | 'EMOTION' | 'EXECUTION';
    summary: string;
}

export interface ProcessStats {
    averageScore: number;
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    weakestArea: 'SETUP' | 'RISK' | 'EMOTION' | 'EXECUTION';
    detailedScores: {
        averageSetup: number;
        averageRisk: number;
        averageEmotion: number;
        averageExecution: number;
    }
}

// Data from user interaction with the ProcessDojoModal
export interface DojoInteractionData {
    startTime: number;
    endTime: number;
}

export type TrustLevel = 'HIGH_TRUST' | 'MEDIUM_TRUST' | 'LOW_TRUST';

export interface ShadowScore {
    rawScore: number; // 0-100
    trustLevel: TrustLevel;
    breakdown: {
        responseAuthenticity: number; // 0-100
        behaviorGap: number; // 0-100
    };
    adjustmentFactors: {
        xpMultiplier: number; // e.g., 1.15 for high trust, 0.85 for low trust
        verificationLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    };
}


// Section 7: Risk Calculator
export interface RiskProfile {
    id: string;
    name: string;
    mode: 'CONSERVATIVE' | 'AGGRESSIVE';
    risk_per_trade_percent: number;
    daily_loss_limit_amount: number;
    gambling_budget?: number; // Only for aggressive
}

export interface CalculationResponse {
    allowed: boolean;
    volume: number;
    leverage_hint: number;
    risk_amount_usdt: number;
    message: string;
    status_color: string;
}

// Section 8: Behavioral Graph
export type NodeType = 'EMOTION' | 'ACTION' | 'OUTCOME' | 'CONTEXT' | 'INTENT';
export type EdgeType = 'TRIGGERS' | 'LEADS_TO' | 'CORRELATES_WITH' | 'PREDICTS';

export interface GraphNode {
    id: string;
    type: NodeType;
    label: string;
    data: Record<string, any>;
    count: number; // How many times this node has been hit
}

export interface GraphEdge {
    source: string; // Node ID
    target: string; // Node ID
    type: EdgeType;
    weight: number; // How many times this edge has been traversed
}

export interface BehavioralGraph {
    nodes: Map<string, GraphNode>;
    edges: Map<string, GraphEdge>;
}

export interface BehavioralReport {
    fingerprint: {
        primaryDriver: string;
        emotionalTrigger: string;
        riskTendency: string;
    };
    activePattern: {
        name: string;
        description: string;
        impact: string;
    };
    predictions: {
        nextWeekFocus: string;
        potentialRisk: string;
    };
    recommendations: {
        action: string;
        metric: string;
    };
}
