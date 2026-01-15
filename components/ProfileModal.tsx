
import React, { useState, useEffect } from 'react';
import type { UserProfile, TraderArchetypeAnalysis } from '../types';
import { UserCircleIcon, BrainCircuitIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface ProfileModalProps {
  userProfile: UserProfile;
  onSave: (newProfile: UserProfile) => void;
  onClose: () => void;
  onDiscoverArchetype: () => Promise<TraderArchetypeAnalysis>;
}

const ArchetypeDisplay: React.FC<{ archetype: UserProfile['archetype'], rationale: string | null, onDiscover: () => void, isLoading: boolean }> = ({ archetype, rationale, onDiscover, isLoading }) => {
  const archetypeInfo = {
    ANALYTICAL_TRADER: { title: "ANALYTICAL_TRADER", color: "text-accent-blue", description: "DATA-DRIVEN_SPECULATOR. UTILIZES_QUANTITATIVE_MODELS_AND_PRECISION_ANALYSIS." },
    EMOTIONAL_TRADER: { title: "EMOTIONAL_TRADER", color: "text-accent-red", description: "SENTIMENT-DRIVEN_ACTOR. HIGH_VULNERABILITY_TO_NEURAL_BIAS_AND_MARKET_TURBULENCE." },
    SYSTEMATIC_TRADER: { title: "SYSTEMATIC_TRADER", color: "text-accent-neon", description: "ALGORITHMIC_OPERATOR. RIGID_ADHERENCE_TO_ESTABLISHED_DISCIPLINE_PROTOCOLS." },
    UNDEFINED: { title: "UNDEFINED_VECTOR", color: "text-white/20", description: "AWAITING_NEURAL_DENSITY_ANALYSIS. INITIATE_SCAN_TO_DETERMINE_CORE_TRADING_LOGIC." }
  };
  const info = archetypeInfo[archetype];

  return (
    <div className="bg-black/40 p-6 rounded-3xl border border-white/5 group hover:border-accent-neon/20 transition-all duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-accent-neon/[0.03] to-transparent pointer-events-none" />
      <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">NEURAL_ARCHETYPE_PROFILE</h3>
      {archetype === 'UNDEFINED' && !isLoading && (
        <div className="text-center p-6 space-y-6">
          <p className="text-[11px] text-white/40 uppercase tracking-wide leading-relaxed italic">{info.description}</p>
          <button onClick={onDiscover} className="w-full bg-accent-neon text-black font-black uppercase text-xs tracking-[0.3em] py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(0,255,157,0.2)]">
            <BrainCircuitIcon className="w-5 h-5" />
            INITIATE_CORE_SCAN
          </button>
        </div>
      )}
      {isLoading && (
        <div className="text-center p-10">
          <div className="w-12 h-12 border-4 border-accent-neon/20 border-t-accent-neon rounded-full animate-spin mx-auto mb-6" />
          <p className="text-[10px] font-black text-accent-neon uppercase tracking-[0.3em] animate-pulse">ANALYZING_NEURAL_FEED_PATTERNS...</p>
        </div>
      )}
      {archetype !== 'UNDEFINED' && !isLoading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className={`text-2xl font-black italic tracking-widest ${info.color} drop-shadow-[0_0_10px_rgba(0,255,157,0.2)]`}>{info.title}</h4>
            <div className="w-2 h-2 rounded-full bg-accent-neon shadow-[0_0_10px_rgba(0,255,157,0.8)] animate-pulse" />
          </div>
          <p className="text-[11px] text-white/60 uppercase tracking-tight leading-relaxed italic border-l-2 border-accent-neon/30 pl-4 bg-accent-neon/[0.02] py-2 rounded-r-lg">{info.description}</p>
          {rationale && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">AI_EVALUATION_RATIONALE</p>
              <p className="text-[10px] text-accent-neon font-medium italic leading-relaxed uppercase tracking-wide">"{rationale}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ userProfile, onSave, onClose, onDiscoverArchetype }) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [archetypeRationale, setArchetypeRationale] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const { t } = useLanguage();

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
      setArchetypeRationale("FAULT_REPORT: NEURAL_ANALYSIS_FAILURE. RE-INITIATE_SCAN.");
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[150] p-6 overflow-hidden">
      <div className="absolute inset-0 cyber-grid opacity-[0.05] pointer-events-none" />
      <div className="bg-black border border-accent-neon/20 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-2xl w-full flex flex-col max-h-[90vh] relative overflow-hidden">
        {/* Corner HUD Markers */}
        <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-accent-neon/30 rounded-tl-[3rem] pointer-events-none" />
        <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-accent-neon/30 rounded-tr-[3rem] pointer-events-none" />

        <header className="p-10 border-b border-accent-neon/5 flex-shrink-0 flex justify-between items-center bg-black/60 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-accent-neon/[0.03] to-transparent pointer-events-none" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-black border border-accent-neon/20 flex items-center justify-center shadow-inner group-hover:border-accent-neon transition-colors">
              <UserCircleIcon className="w-6 h-6 text-accent-neon drop-shadow-[0_0_8px_rgba(0,255,157,0.5)]" />
            </div>
            <div>
              <h2 className="text-[10px] font-black text-accent-neon uppercase tracking-[0.5em] mb-2 drop-shadow-[0_0_5px_rgba(0,255,157,0.5)]">OPERATOR_IDENTITY_VECT</h2>
              <h3 className="text-3xl font-black text-white tracking-widest uppercase italic font-sans italic leading-none">{t('profile.title')}</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 transition-all font-sans text-2xl relative z-10">&times;</button>
        </header>

        <form onSubmit={handleSave} className="flex-grow overflow-y-auto px-10 py-8 min-h-0 custom-scrollbar space-y-10 relative z-10">
          {/* Username Section */}
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 hover:border-accent-neon/10 transition-all duration-500">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-6 flex items-center">
              <span className="w-1.5 h-4 bg-accent-neon mr-3 shadow-[0_0_10px_rgba(0,255,157,0.8)]"></span>
              NEURAL_IDENTITY_HANDLE
            </h3>
            <div className="space-y-4">
              <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">ANONYMOUS_OPERATOR_NAME</label>
              <input
                type="text"
                value={profile.username || ''}
                onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                placeholder="OPERATOR_X, SHADOW_001..."
                className="w-full bg-black border border-white/10 rounded-xl py-4 px-6 text-accent-neon font-black italic tracking-widest focus:border-accent-neon focus:ring-0 outline-none transition-all"
                maxLength={20}
              />
              <p className="text-[9px] text-white/20 uppercase tracking-widest italic font-medium">SYSTEM_REQUIREMENT: 3-20_CHARS, ALPHANUMERIC_ONLY</p>
            </div>
          </div>

          <ArchetypeDisplay archetype={profile.archetype} rationale={archetypeRationale} onDiscover={handleDiscover} isLoading={isDiscovering} />

          {/* Capital Management - Link to Mindset */}
          <div className="bg-black/40 p-6 rounded-2xl border border-accent-neon/10 hover:border-accent-neon/30 transition-all duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-black text-accent-neon uppercase tracking-[0.3em] mb-2">CAPITAL_&_RISK_MANAGEMENT</h3>
                <p className="text-sm text-white/50">Vốn: <span className="text-accent-neon font-bold">${profile.accountBalance.toLocaleString()}</span></p>
                <p className="text-[10px] text-white/30 mt-2">Cài đặt rủi ro chi tiết tại <span className="text-accent-neon">Tab Tư Duy</span></p>
              </div>
              <div className="text-4xl">⚙️</div>
            </div>
          </div>

          {/* User Constraints */}
          <div className="bg-black/40 p-6 rounded-2xl border border-white/5 hover:border-accent-blue/10 transition-all duration-500">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-10 flex items-center">
              <span className="w-1.5 h-4 bg-accent-blue mr-3 shadow-[0_0_10px_rgba(0,111,255,0.8)]"></span>
              TRADING_DISCIPLINE_CONSTRAINTS
            </h3>
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">DAILY_TRANSACTION_CEILING</label>
                    <p className="text-xl font-black text-white uppercase italic tracking-widest">{profile.tradingRules.dailyTradeLimit} <span className="text-[10px] text-white/20 tracking-normal">TRADES_LIMIT</span></p>
                  </div>
                  <span className="text-[9px] font-black text-accent-blue uppercase tracking-widest animate-pulse">SYSTEM_ENFORCED</span>
                </div>
                <input type="range" value={profile.tradingRules.dailyTradeLimit} onChange={(e) => handleChange('tradingRules', 'dailyTradeLimit', Number(e.target.value))} min="1" max="20" step="1" className="w-full h-1.5 bg-black border border-white/10 rounded-full appearance-none cursor-pointer accent-accent-blue shadow-inner" />
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-end">
                  <div>
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] block mb-2">SENSITIVITY_THRESHOLD_CALIBRATION</label>
                    <p className="text-xl font-black text-white uppercase italic tracking-widest">{profile.tradingRules.positionSizeWarningThreshold}% <span className="text-[10px] text-white/20 tracking-normal">ACCURACY_TOLERANCE</span></p>
                  </div>
                  <span className="text-[9px] font-black text-accent-neon/40 uppercase tracking-widest">NEURAL_GAIN</span>
                </div>
                <input type="range" value={profile.tradingRules.positionSizeWarningThreshold} onChange={(e) => handleChange('tradingRules', 'positionSizeWarningThreshold', Number(e.target.value))} min="100" max="300" step="10" className="w-full h-1.5 bg-black border border-white/10 rounded-full appearance-none cursor-pointer accent-accent-neon shadow-inner" />
              </div>
            </div>
          </div>
        </form>

        <footer className="p-10 border-t border-accent-neon/5 flex-shrink-0 flex justify-end items-center gap-6 bg-black/80 rounded-b-[3rem] relative z-10">
          <button type="button" onClick={onClose} className="px-10 py-4 rounded-xl text-[10px] font-black text-white/40 hover:text-white uppercase tracking-[0.5em] transition-all">[ ABORT_CHANGES ]</button>
          <button type="submit" onClick={handleSave} className="px-12 py-4 rounded-xl text-[10px] font-black text-black bg-accent-neon hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[0.5em] transition-all shadow-[0_0_30px_rgba(0,255,157,0.2)]">COMMIT_IDENTITY_SYNCHRONIZATION</button>
        </footer>
      </div>
    </div>
  );
};
