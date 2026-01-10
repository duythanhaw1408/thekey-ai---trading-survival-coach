
import type { Trade, BehavioralReport, CheckinAnalysisResult, BehavioralGraph, GraphNode, GraphEdge, NodeType, EdgeType } from '../types';

export class BehavioralGraphEngine {
    private graph: BehavioralGraph = {
        nodes: new Map(),
        edges: new Map(),
    };

    constructor() {
        // The engine is initialized and will build its graph over time.
    }

    public buildGraphFromHistory(tradeHistory: Trade[]): void {
        this.graph.nodes.clear();
        this.graph.edges.clear();

        // Guard against null/undefined trade history
        if (!tradeHistory || !Array.isArray(tradeHistory)) {
            console.log("Behavioral graph: No valid trade history to build from");
            return;
        }

        const sortedHistory = [...tradeHistory].reverse(); // Process in chronological order
        for (const trade of sortedHistory) {
            if (trade.status === 'CLOSED' && trade.userProcessEvaluation) {
                this.addTradeToGraph(trade);
            }
        }
        console.log("Behavioral graph built from history:", this.graph);
    }

    private addOrUpdateNode(id: string, type: NodeType, label: string, data: Record<string, any> = {}): GraphNode {
        if (this.graph.nodes.has(id)) {
            const node = this.graph.nodes.get(id)!;
            node.count += 1;
            return node;
        } else {
            const newNode: GraphNode = { id, type, label, data, count: 1 };
            this.graph.nodes.set(id, newNode);
            return newNode;
        }
    }

    private addOrUpdateEdge(sourceId: string, targetId: string, type: EdgeType): void {
        const edgeId = `${sourceId}-${type}->${targetId}`;
        if (this.graph.edges.has(edgeId)) {
            const edge = this.graph.edges.get(edgeId)!;
            edge.weight += 1;
        } else {
            const newEdge: GraphEdge = { source: sourceId, target: targetId, type, weight: 1 };
            this.graph.edges.set(edgeId, newEdge);
        }
    }

    public addTradeToGraph(trade: Trade): void {
        if (!trade.userProcessEvaluation || !trade.processEvaluation) {
            return;
        }

        const consecutiveLosses = trade.statsAtEntry?.consecutiveLosses ?? 0;
        const contextLabel = consecutiveLosses > 1 ? `${consecutiveLosses} Losses` : 'Neutral Context';
        const contextNode = this.addOrUpdateNode(`context_${contextLabel.replace(' ', '_')}`, 'CONTEXT', contextLabel);

        const emotion = trade.userProcessEvaluation.dominantEmotion;
        const emotionNode = this.addOrUpdateNode(`emotion_${emotion}`, 'EMOTION', emotion);

        const intent = trade.reasoning || 'No specific intent';
        let intentCategory = 'Other';
        if (intent.toLowerCase().includes('breakout')) intentCategory = 'Breakout';
        if (intent.toLowerCase().includes('support') || intent.toLowerCase().includes('retest')) intentCategory = 'Support/Retest';
        const intentNode = this.addOrUpdateNode(`intent_${intentCategory}`, 'INTENT', intentCategory, { fullText: intent });

        const actionLabel = `${trade.direction} ${trade.asset}`;
        const actionNode = this.addOrUpdateNode(`action_${actionLabel.replace('/', '_')}`, 'ACTION', actionLabel, { size: trade.positionSize });

        const pnl = trade.pnl ?? 0;
        const outcomeCategory = pnl > 0 ? 'Win' : 'Loss';
        const processScoreCategory = trade.processEvaluation.totalProcessScore > 70 ? 'Good Process' : 'Bad Process';
        const outcomeLabel = `${outcomeCategory} / ${processScoreCategory}`;
        const outcomeNode = this.addOrUpdateNode(`outcome_${outcomeLabel.replace(' / ', '_').replace(' ', '_')}`, 'OUTCOME', outcomeLabel, { pnl });

        this.addOrUpdateEdge(contextNode.id, emotionNode.id, 'TRIGGERS');
        this.addOrUpdateEdge(emotionNode.id, intentNode.id, 'LEADS_TO');
        this.addOrUpdateEdge(intentNode.id, actionNode.id, 'LEADS_TO');
        this.addOrUpdateEdge(actionNode.id, outcomeNode.id, 'LEADS_TO');
    }

    public generatePersonalBehaviorReport(): BehavioralReport {
        const report: BehavioralReport = {
            fingerprint: {
                primaryDriver: 'Not enough data.',
                emotionalTrigger: 'Not enough data.',
                riskTendency: 'Not enough data.',
            },
            activePattern: {
                name: 'No significant pattern detected.',
                description: 'Your behavior appears consistent without strong repeating patterns.',
                impact: 'N/A',
            },
            predictions: {
                nextWeekFocus: 'Maintain current process discipline.',
                potentialRisk: 'Be aware of any emerging emotional triggers.',
            },
            recommendations: {
                action: 'Continue with daily check-ins to build a stronger data profile.',
                metric: 'Discipline Score',
            },
        };

        if (this.graph.nodes.size < 5) {
            return report;
        }

        report.fingerprint.primaryDriver = "Profit Seeking";

        const emotionTriggerEdge = this.findStrongestEdgeFromNodeType('CONTEXT', 'TRIGGERS');
        if (emotionTriggerEdge) {
            const emotionNode = this.graph.nodes.get(emotionTriggerEdge.target)!;
            const contextNode = this.graph.nodes.get(emotionTriggerEdge.source)!;
            report.fingerprint.emotionalTrigger = `The context of '${contextNode.label}' often triggers '${emotionNode.label}'.`;
        }

        const actionNodes = Array.from(this.graph.nodes.values()).filter(n => n.type === 'ACTION');
        const avgSize = actionNodes.reduce((sum, node) => sum + (node.data.size || 0), 0) / actionNodes.length;
        report.fingerprint.riskTendency = avgSize > 150 ? 'Tends toward high-risk setups.' : 'Generally maintains controlled risk.';

        const strongestPath = this.findStrongestPath();
        if (strongestPath.length >= 4) {
            const [context, emotion, , outcome] = strongestPath.map(id => this.graph.nodes.get(id)!);
            report.activePattern = {
                name: `Pattern: ${emotion.label} Trading`,
                description: `When in a '${context.label}' state, you tend to feel '${emotion.label}', which often results in a '${outcome.label}'.`,
                impact: `This pattern can lead to predictable outcomes. Understanding it is the first step to changing it.`
            };
        }

        if (report.activePattern.name !== 'No significant pattern detected.') {
            report.predictions.nextWeekFocus = `Interrupting the '${report.activePattern.name}' pattern.`;
            const contextLabel = report.fingerprint.emotionalTrigger.split("'")[1];
            if (contextLabel) report.predictions.potentialRisk = `When you notice the '${contextLabel}' context, be mindful of the urge to act.`;
            const emotionLabel = report.fingerprint.emotionalTrigger.split("'")[3];
            if (emotionLabel) report.recommendations.action = `When you feel '${emotionLabel}', pause for 5 minutes before deciding on an action.`;
            report.recommendations.metric = 'Instances of this pattern occurring.';
        }

        return report;
    }

    private findStrongestEdgeFromNodeType(nodeType: NodeType, edgeType: EdgeType): GraphEdge | null {
        return Array.from(this.graph.edges.values())
            .filter(edge => {
                const sourceNode = this.graph.nodes.get(edge.source);
                return sourceNode && sourceNode.type === nodeType && edge.type === edgeType;
            })
            .sort((a, b) => b.weight - a.weight)[0] || null;
    }

    private findStrongestPath(): string[] {
        const contextNodes = Array.from(this.graph.nodes.values()).filter(n => n.type === 'CONTEXT');
        if (contextNodes.length === 0) return [];

        const startNode = contextNodes.sort((a, b) => b.count - a.count)[0];

        const path: string[] = [startNode.id];
        let currentNodeId = startNode.id;

        for (let i = 0; i < 3; i++) {
            const nextEdge = Array.from(this.graph.edges.values())
                .filter(e => e.source === currentNodeId)
                .sort((a, b) => b.weight - a.weight)[0];

            if (nextEdge) {
                path.push(nextEdge.target);
                currentNodeId = nextEdge.target;
            } else {
                break;
            }
        }

        return path.length > 2 ? path : [];
    }
}

export const behavioralGraphEngine = new BehavioralGraphEngine();
