
import React, { useState, useEffect } from 'react';
import type { UserProfile, TraderArchetypeAnalysis } from '../types';
import { UserCircleIcon, BrainCircuitIcon } from './icons';

interface ProfileModalProps {
  userProfile: UserProfile;
  onSave: (newProfile: UserProfile) => void;
  onClose: () => void;
  onDiscoverArchetype: () => Promise<TraderArchetypeAnalysis>;
}

const ArchetypeDisplay: React.FC<{ archetype: UserProfile['archetype'], rationale: string | null, onDiscover: () => void, isLoading: boolean }> = ({ archetype, rationale, onDiscover, isLoading }) => {
  const archetypeInfo = {
    ANALYTICAL_TRADER: { title: "Nhà Giao Dịch Phân Tích", color: "text-accent-blue", description: "Bạn có xu hướng dựa vào dữ liệu, phân tích kỹ thuật và có kế hoạch rõ ràng." },
    EMOTIONAL_TRADER: { title: "Nhà Giao Dịch Cảm Xúc", color: "text-accent-red", description: "Các quyết định của bạn thường bị ảnh hưởng bởi cảm xúc như sợ hãi, tham lam, hoặc hưng phấn." },
    SYSTEMATIC_TRADER: { title: "Nhà Giao Dịch Hệ Thống", color: "text-accent-green", description: "Bạn tuân thủ nghiêm ngặt một bộ quy tắc và hệ thống giao dịch đã được xác định trước." },
    UNDEFINED: { title: "Chưa xác định", color: "text-text-secondary", description: "Hãy để AI phân tích hành vi của bạn để khám phá phong cách giao dịch cốt lõi của bạn." }
  };
  const info = archetypeInfo[archetype];

  return (
    <div className="bg-background p-4 rounded-md border border-divider">
      <h3 className="text-sm font-semibold text-text-secondary mb-2">Trader Archetype</h3>
      {archetype === 'UNDEFINED' && !isLoading && (
        <div className="text-center p-4">
          <p className="text-text-secondary mb-4">{info.description}</p>
          <button onClick={onDiscover} className="bg-accent-primary text-black font-semibold py-2 px-4 rounded-md hover:brightness-110 transition-all flex items-center justify-center mx-auto">
            <BrainCircuitIcon className="w-5 h-5 mr-2" />
            Khám phá Archetype của tôi
          </button>
        </div>
      )}
      {isLoading && (
        <div className="text-center p-4">
          <svg className="animate-spin mx-auto h-8 w-8 text-accent-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <p className="mt-2 text-text-secondary">AI đang phân tích hành vi của bạn...</p>
        </div>
      )}
      {archetype !== 'UNDEFINED' && !isLoading && (
        <div>
          <h4 className={`text-lg font-bold ${info.color}`}>{info.title}</h4>
          <p className="text-sm text-text-secondary mt-1">{info.description}</p>
          {rationale && <p className="text-sm text-text-main mt-3 pt-3 border-t border-divider italic">"{rationale}"</p>}
        </div>
      )}
    </div>
  );
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ userProfile, onSave, onClose, onDiscoverArchetype }) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [archetypeRationale, setArchetypeRationale] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(profile);
    onClose();
  };

  const handleChange = (section: keyof UserProfile, key: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [key]: value
      }
    }));
  };

  const handleDiscover = async () => {
    setIsDiscovering(true);
    setArchetypeRationale(null);
    try {
      const result = await onDiscoverArchetype();
      setArchetypeRationale(result.rationale);
    } catch (error) {
      console.error("Failed to discover archetype:", error);
      setArchetypeRationale("Lỗi: Không thể phân tích archetype của bạn lúc này.");
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-panel rounded-md shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] border border-divider">
        <header className="p-4 border-b border-divider flex-shrink-0 flex justify-between items-center">
          <div className="flex items-center">
            <UserCircleIcon className="w-6 h-6 mr-3 text-accent-primary" />
            <h2 className="text-lg font-bold text-text-main">User Profile & Settings</h2>
          </div>
          <button onClick={onClose} className="text-2xl text-text-secondary hover:text-text-main">&times;</button>
        </header>

        <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* Username Section - For Anonymity */}
          <div className="bg-background p-4 rounded-md border border-divider">
            <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center">
              <span className="w-2 h-2 bg-accent-primary rounded-full mr-2"></span>
              Anonymous Display Name
            </h3>
            <div>
              <label className="text-xs text-text-secondary uppercase mb-1 block">Username (hiển thị công khai)</label>
              <input
                type="text"
                value={profile.username || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder="VD: trader_001, shadow_master..."
                className="w-full bg-background border border-divider rounded-md py-2 px-3 text-accent-primary font-mono focus:border-accent-primary outline-none"
                maxLength={20}
              />
              <p className="text-[10px] text-gray-500 mt-1">3-20 ký tự, chỉ chữ cái, số và underscore (_)</p>
            </div>
          </div>

          <ArchetypeDisplay archetype={profile.archetype} rationale={archetypeRationale} onDiscover={handleDiscover} isLoading={isDiscovering} />

          <div className="bg-background p-4 rounded-md border border-divider">
            <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center">
              <span className="w-2 h-2 bg-accent-green rounded-full mr-2"></span>
              Capital Management (Quản lý vốn)
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-secondary uppercase mb-1 block">Account Balance (Vốn đầu tư $)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                  <input
                    type="number"
                    value={profile.accountBalance}
                    onChange={(e) => setProfile(prev => ({ ...prev, accountBalance: Number(e.target.value) }))}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-background border border-divider rounded-md py-2 pl-8 pr-4 text-accent-primary font-mono focus:border-accent-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-secondary uppercase mb-1 block">Max Size (USD)</label>
                  <input
                    type="number"
                    value={profile.tradingRules.maxPositionSizeUSD || 0}
                    onChange={(e) => handleChange('tradingRules', 'maxPositionSizeUSD', Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-background border border-divider rounded-md py-2 px-3 text-accent-blue font-mono focus:border-accent-blue outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary uppercase mb-1 block">Risk per Trade (%)</label>
                  <input
                    type="number"
                    value={profile.tradingRules.riskPerTradePct || 0}
                    onChange={(e) => handleChange('tradingRules', 'riskPerTradePct', Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="w-full bg-background border border-divider rounded-md py-2 px-3 text-accent-green font-mono focus:border-accent-green outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background p-4 rounded-md border border-divider">
            <h3 className="text-sm font-semibold text-text-secondary mb-4 flex items-center">
              <span className="w-2 h-2 bg-accent-blue rounded-full mr-2"></span>
              Trading Rules
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="dailyTradeLimit" className="text-sm font-medium text-text-main">Daily Trade Limit</label>
                  <span className="text-sm font-mono rounded-md bg-panel text-accent-primary">{profile.tradingRules.dailyTradeLimit} trades</span>
                </div>
                <input type="range" id="dailyTradeLimit" value={profile.tradingRules.dailyTradeLimit} onChange={(e) => handleChange('tradingRules', 'dailyTradeLimit', Number(e.target.value))} min="1" max="20" step="1" className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-accent-primary" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="positionSizeWarningThreshold" className="text-sm font-medium text-text-main">Sensitivity Threshold (%)</label>
                  <span className="text-sm font-mono rounded-md bg-panel text-accent-primary">{profile.tradingRules.positionSizeWarningThreshold}%</span>
                </div>
                <input type="range" id="positionSizeWarningThreshold" value={profile.tradingRules.positionSizeWarningThreshold} onChange={(e) => handleChange('tradingRules', 'positionSizeWarningThreshold', Number(e.target.value))} min="100" max="300" step="10" className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-accent-primary" />
                <p className="text-[10px] text-text-secondary mt-1">Mức độ nhạy bén của cảnh báo dựa trên volume dự kiến.</p>
              </div>
            </div>
          </div>
        </form>

        <footer className="p-4 border-t border-divider flex-shrink-0 flex justify-end items-center space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-text-main bg-gray-600 hover:bg-gray-500 transition-colors">Cancel</button>
          <button type="submit" onClick={handleSave} className="px-4 py-2 rounded-md text-black font-semibold bg-accent-primary hover:brightness-110 transition-colors">Save Profile</button>
        </footer>
      </div>
    </div>
  );
};
