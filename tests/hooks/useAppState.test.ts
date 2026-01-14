// tests/hooks/useAppState.test.ts
/**
 * Tests for useAppState hook
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppState, DEFAULT_USER_PROFILE, DEFAULT_STATS } from '../../hooks/useAppState';

describe('useAppState', () => {

    it('should initialize with default stats', () => {
        const { result } = renderHook(() => useAppState());

        expect(result.current.stats).toEqual(DEFAULT_STATS);
        expect(result.current.stats.survivalDays).toBe(7);
        expect(result.current.stats.disciplineScore).toBe(92);
    });

    it('should initialize with default user profile', () => {
        const { result } = renderHook(() => useAppState());

        expect(result.current.userProfile.accountBalance).toBe(1000);
        expect(result.current.userProfile.protectionLevel).toBe('SURVIVAL');
        expect(result.current.userProfile.tradingRules.dailyTradeLimit).toBe(5);
    });

    it('should update stats correctly', () => {
        const { result } = renderHook(() => useAppState());

        act(() => {
            result.current.setStats(prev => ({
                ...prev,
                consecutiveLosses: 2
            }));
        });

        expect(result.current.stats.consecutiveLosses).toBe(2);
    });

    it('should update trade history', () => {
        const { result } = renderHook(() => useAppState());

        const mockTrade = {
            id: 1,
            timestamp: new Date(),
            asset: 'BTCUSD',
            direction: 'BUY' as const,
            positionSize: 100,
            entryPrice: 50000,
            status: 'OPEN' as const,
            decision: 'ALLOW' as const,
            mode: 'SIMULATION' as const,
        };

        act(() => {
            result.current.setTradeHistory([mockTrade]);
        });

        expect(result.current.tradeHistory).toHaveLength(1);
        expect(result.current.tradeHistory[0].asset).toBe('BTCUSD');
    });

    it('should toggle simulation mode', () => {
        const { result } = renderHook(() => useAppState());

        expect(result.current.simulationMode).toBe(true);

        act(() => {
            result.current.setSimulationMode(false);
        });

        expect(result.current.simulationMode).toBe(false);
    });

    it('should manage messages array', () => {
        const { result } = renderHook(() => useAppState());

        expect(result.current.messages).toEqual([]);

        act(() => {
            result.current.setMessages([{
                id: 1,
                sender: 'ai',
                type: 'text',
                text: 'Hello!'
            }]);
        });

        expect(result.current.messages).toHaveLength(1);
        expect((result.current.messages[0] as any).text).toBe('Hello!');
    });

    it('should update user profile', () => {
        const { result } = renderHook(() => useAppState());

        act(() => {
            result.current.setUserProfile(prev => ({
                ...prev,
                accountBalance: 5000,
                protectionLevel: 'DISCIPLINE'
            }));
        });

        expect(result.current.userProfile.accountBalance).toBe(5000);
        expect(result.current.userProfile.protectionLevel).toBe('DISCIPLINE');
    });

    it('should manage loading states', () => {
        const { result } = renderHook(() => useAppState());

        expect(result.current.isLoading).toBe(false);
        expect(result.current.isChatting).toBe(false);

        act(() => {
            result.current.setIsLoading(true);
            result.current.setIsChatting(true);
        });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.isChatting).toBe(true);
    });

    it('should manage streak and engagement data', () => {
        const { result } = renderHook(() => useAppState());

        act(() => {
            result.current.setStreak(5);
            result.current.setLastActiveDate('2024-01-01');
        });

        expect(result.current.streak).toBe(5);
        expect(result.current.lastActiveDate).toBe('2024-01-01');
    });

    it('should manage XP and level up states', () => {
        const { result } = renderHook(() => useAppState());

        act(() => {
            result.current.setLastXpGain(50);
            result.current.setXpGainTrigger(1);
            result.current.setShowLevelUp(true);
            result.current.setNewLevelTitle('SURVIVOR');
        });

        expect(result.current.lastXpGain).toBe(50);
        expect(result.current.showLevelUp).toBe(true);
        expect(result.current.newLevelTitle).toBe('SURVIVOR');
    });
});
