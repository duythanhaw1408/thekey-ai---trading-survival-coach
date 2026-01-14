

import type { UserProfile, EmotionalState, NotificationContext, Notification, NotificationAction, Trade } from '../types';
import { biofeedbackAnalyzer } from './biofeedbackService';

// This is a placeholder for a service that would fetch user data
const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  return {
    id: userId,
    archetype: 'EMOTIONAL_TRADER',
    accountBalance: 1000,
    protectionLevel: 'SURVIVAL',
    cooldownMinutes: 30,
    consecutiveLossLimit: 3,
    tradingRules: {
      dailyTradeLimit: 5,
      positionSizeWarningThreshold: 200,
    },
    notificationPreferences: {
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: false,
      quietHours: { start: '22:00', end: '08:00' },
    },
    sleepSchedule: { start: '23:00', end: '07:00' },
  };
};

// This service is now enhanced with bio-awareness
const getEmotionalState = async (userId: string): Promise<EmotionalState> => {
  // In a real app, this would get real trade history
  const mockTradeHistory: Trade[] = [];

  const bioAnalysis = await biofeedbackAnalyzer.analyzeCorrelation(mockTradeHistory);

  if (bioAnalysis.correlationFound) {
    // Bio-feedback indicates stress, override default state
    return {
      primary: 'FRUSTRATED',
      level: 8,
      triggers: ['Physiological stress detected', bioAnalysis.evidence]
    }
  }

  // Default state if no bio-correlation is found
  return {
    primary: 'NEUTRAL',
    level: 4,
    triggers: ['Market is stable'],
  }
}

const TONE_MATRIX = {
  REVENGE_BLOCK: {
    FRUSTRATED: 'EMPATHETIC_FIRM',
    PANIC: 'CALMING_ASSERTIVE',
    EUPHORIC: 'CAUTIONARY',
    NEUTRAL: 'DIRECT'
  },
  DANGER_ALERT: {
    FRUSTRATED: 'EMPATHETIC_WARNING',
    PANIC: 'REASSURING_WARNING',
    EUPHORIC: 'CAUTIONARY_WARNING',
    NEUTRAL: 'CLEAR_WARNING'
  },
  SUCCESS_CELEBRATION: {
    FRUSTRATED: 'ENCOURAGING',
    PANIC: 'GROUNDING',
    EUPHORIC: 'CELEBRATORY',
    NEUTRAL: 'POSITIVE'
  }
};

export class SmartNotificationEngine {

  public async generateNotification(userId: string, context: NotificationContext): Promise<Notification> {
    const userProfile = await fetchUserProfile(userId);
    const emotionalState = await getEmotionalState(userId);

    const priority = this.calculatePriority(context, emotionalState);
    const deliveryMethods = this.selectDeliveryMethods(userProfile.notificationPreferences, priority);
    const tone = this.selectTone(context.type, emotionalState);
    const content = this.generateContent(context, emotionalState, tone);
    const actions = this.generateActions(context);
    const optimalDeliveryTime = await this.calculateOptimalTime(userProfile, context);

    return {
      id: crypto.randomUUID(),
      type: context.type,
      priority,
      title: content.title,
      body: content.body,
      actions,
      metadata: {
        emotionalState,
        optimalDeliveryTime,
        tone,
      },
      deliveryMethods,
    };
  }

  private calculatePriority(context: NotificationContext, emotionalState: EmotionalState): Notification['priority'] {
    const marketDanger = context.marketData?.dangerScore || 0;

    if (context.type === 'REVENGE_BLOCK' && emotionalState.primary === 'PANIC' && marketDanger > 80) {
      return 'CRITICAL';
    }
    if (context.urgency === 'HIGH' || emotionalState.level > 7) {
      return 'HIGH';
    }
    if (context.urgency === 'MEDIUM') {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private async calculateOptimalTime(userProfile: UserProfile, context: NotificationContext): Promise<number> {
    const now = new Date();
    const [quietStartHour, quietStartMin] = userProfile.notificationPreferences.quietHours.start.split(':').map(Number);
    const [quietEndHour, quietEndMin] = userProfile.notificationPreferences.quietHours.end.split(':').map(Number);
    const [sleepStartHour, sleepStartMin] = userProfile.sleepSchedule.start.split(':').map(Number);
    const [sleepEndHour, sleepEndMin] = userProfile.sleepSchedule.end.split(':').map(Number);

    const isUrgent = context.urgency === 'HIGH';

    const isDuringQuietHours = (now.getHours() > quietStartHour || (now.getHours() === quietStartHour && now.getMinutes() >= quietStartMin)) ||
      (now.getHours() < quietEndHour || (now.getHours() === quietEndHour && now.getMinutes() <= quietEndMin));

    const isDuringSleep = (now.getHours() > sleepStartHour || (now.getHours() === sleepStartHour && now.getMinutes() >= sleepStartMin)) ||
      (now.getHours() < sleepEndHour || (now.getHours() === sleepEndHour && now.getMinutes() <= sleepEndMin));

    if (!isUrgent && (isDuringQuietHours || isDuringSleep)) {
      // Postpone until after quiet/sleep hours end
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(quietEndHour, quietEndMin, 0, 0);
      return tomorrow.getTime();
    }

    // Send immediately
    return now.getTime();
  }

  private selectTone(notificationType: NotificationContext['type'], emotionalState: EmotionalState): string {
    return TONE_MATRIX[notificationType][emotionalState.primary] || 'DIRECT';
  }

  private generateContent(context: NotificationContext, emotionalState: EmotionalState, tone: string): { title: string; body: string } {
    switch (context.type) {
      case 'REVENGE_BLOCK':
        return {
          title: "⏸️ Hãy dừng lại một chút",
          body: "Tôi hiểu bạn đang muốn gỡ lại. Theo data, trades sau 2 losses có win rate 28% thay vì 52%. Chờ thêm 30 phút nhé.",
        };
      case 'DANGER_ALERT':
        const score = context.marketData?.dangerScore || 85;
        return {
          title: "⚠️ Market đang rất nguy hiểm",
          body: `Market danger score: ${score}/100. 85% losses của bạn xảy ra trong điều kiện tương tự.`,
        };
      case 'SUCCESS_CELEBRATION':
        return {
          title: "🎉 Kỷ luật được đền đáp!",
          body: "Bạn vừa tuân thủ kế hoạch một cách xuất sắc. Hãy ghi nhận chiến thắng này và duy trì sự tập trung."
        }
      default:
        return { title: "Thông báo từ THEKEY AI", body: "Đây là một cập nhật cho bạn." };
    }
  }

  private generateActions(context: NotificationContext): Array<NotificationAction> {
    switch (context.type) {
      case 'REVENGE_BLOCK':
        return [
          { id: 'breathe', label: '🌬️ Bài tập thở', action: 'OPEN_BREATHING_EXERCISE' },
          { id: 'journal', label: '📝 Viết cảm xúc', action: 'OPEN_JOURNAL' }
        ];
      case 'DANGER_ALERT':
        return [
          { id: 'adjust', label: '🛡️ Điều chỉnh lệnh', action: 'ADJUST_TRADE' },
          { id: 'cancel', label: '❌ Hủy lệnh', action: 'CANCEL_TRADE' }
        ];
      default:
        return [];
    }
  }

  // FIX: Change return type to match the Notification['deliveryMethods'] type.
  private selectDeliveryMethods(preferences: UserProfile['notificationPreferences'], priority: Notification['priority']): Array<'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS'> {
    const methods: Array<'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS'> = ['IN_APP'];
    if (preferences.pushEnabled) {
      methods.push('PUSH');
    }
    if (priority === 'CRITICAL' && preferences.smsEnabled) {
      methods.push('SMS');
    }
    if (priority === 'LOW' && preferences.emailEnabled) {
      methods.push('EMAIL');
    }
    return methods;
  }
}