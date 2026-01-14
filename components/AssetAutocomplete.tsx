// components/AssetAutocomplete.tsx
/**
 * THEKEY AI - Asset Autocomplete Component
 * 
 * Smart autocomplete for trading assets with:
 * - Recent assets from history
 * - Popular crypto pairs
 * - Real-time search
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AssetAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    recentAssets?: string[];
    className?: string;
    placeholder?: string;
}

// Popular trading pairs
const POPULAR_ASSETS = [
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT',
    'DOGE/USDT', 'ADA/USDT', 'MATIC/USDT', 'DOT/USDT', 'AVAX/USDT',
    'LINK/USDT', 'UNI/USDT', 'LTC/USDT', 'ATOM/USDT', 'FTM/USDT',
    'NEAR/USDT', 'APE/USDT', 'ARB/USDT', 'OP/USDT', 'PEPE/USDT'
];

export const AssetAutocomplete: React.FC<AssetAutocompleteProps> = ({
    value,
    onChange,
    recentAssets = [],
    className = '',
    placeholder = 'VD: BTC/USDT'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState(value);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Combine and deduplicate assets
    const suggestions = useMemo(() => {
        const recent = recentAssets.slice(0, 5);
        const combined = [...new Set([...recent, ...POPULAR_ASSETS])];

        if (!search) return combined.slice(0, 10);

        const searchUpper = search.toUpperCase();
        return combined
            .filter(asset => asset.includes(searchUpper))
            .slice(0, 10);
    }, [search, recentAssets]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, -1));
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                    handleSelect(suggestions[selectedIndex]);
                } else if (search) {
                    handleSelect(search.toUpperCase());
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSelectedIndex(-1);
                break;
        }
    };

    const handleSelect = (asset: string) => {
        const normalized = asset.toUpperCase();
        setSearch(normalized);
        onChange(normalized);
        setIsOpen(false);
        setSelectedIndex(-1);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value.toUpperCase();
        setSearch(newValue);
        onChange(newValue);
        setIsOpen(true);
        setSelectedIndex(-1);
    };

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={className}
                autoComplete="off"
            />

            <AnimatePresence>
                {isOpen && suggestions.length > 0 && (
                    <motion.div
                        ref={dropdownRef}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-1 bg-panel border border-white/10 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto"
                    >
                        {/* Recent section */}
                        {recentAssets.length > 0 && !search && (
                            <div className="px-3 py-2 bg-white/5 border-b border-white/5">
                                <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
                                    Gần đây
                                </span>
                            </div>
                        )}

                        {suggestions.map((asset, index) => {
                            const isRecent = recentAssets.includes(asset);
                            const isSelected = index === selectedIndex;

                            return (
                                <button
                                    key={asset}
                                    type="button"
                                    onClick={() => handleSelect(asset)}
                                    className={`w-full px-3 py-2.5 text-left text-sm flex items-center justify-between transition-colors ${isSelected
                                            ? 'bg-accent-primary/20 text-white'
                                            : 'hover:bg-white/5 text-white/80'
                                        }`}
                                >
                                    <span className="font-mono">{asset}</span>
                                    {isRecent && (
                                        <span className="text-[9px] text-accent-primary bg-accent-primary/10 px-1.5 py-0.5 rounded">
                                            Gần đây
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
