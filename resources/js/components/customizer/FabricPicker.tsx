import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import type { Fabric } from '../../types/customizer';

interface FabricPickerProps {
    fabrics: Fabric[];
    selectedId: number | null;
    onSelect: (id: number) => void;
}

export default function FabricPicker({ fabrics, selectedId, onSelect }: FabricPickerProps) {
    if (fabrics.length === 0) return null;

    return (
        <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Fabric & Color</h3>
            <div className="flex flex-wrap gap-2">
                {fabrics.map(fabric => {
                    const isSelected = fabric.id === selectedId;
                    return (
                        <motion.button
                            key={fabric.id}
                            onClick={() => onSelect(fabric.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            aria-label={`${fabric.name}${fabric.price_modifier !== 0 ? ` +₾${fabric.price_modifier}` : ''}`}
                            aria-pressed={isSelected}
                            title={fabric.name}
                            className="relative w-9 h-9 rounded-full border-2 transition-all"
                            style={{
                                backgroundColor: fabric.color_hex,
                                borderColor: isSelected ? '#0f172a' : '#e2e8f0',
                                boxShadow: isSelected
                                    ? '0 0 0 2px white, 0 0 0 4px #0f172a'
                                    : undefined,
                            }}
                        >
                            {isSelected && (
                                <Check
                                    className="absolute inset-0 m-auto w-4 h-4"
                                    style={{
                                        // Use dark check on light colors, light check on dark
                                        color: isLight(fabric.color_hex) ? '#0f172a' : '#ffffff',
                                    }}
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
            {/* Show selected fabric name */}
            {selectedId !== null && (
                <p className="text-xs text-slate-400 mt-2">
                    {fabrics.find(f => f.id === selectedId)?.name ?? ''}
                </p>
            )}
        </div>
    );
}

function isLight(hex: string): boolean {
    const clean = hex.replace('#', '');
    if (clean.length < 6) return true;
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}
