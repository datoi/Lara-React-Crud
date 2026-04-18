import { motion } from 'motion/react';
import { CheckCircle, Circle } from 'lucide-react';

interface Props {
    profileComplete: boolean;
    productsCount:   number;
    onAddProduct:    () => void;
    onEditProfile:   () => void;
}

const GOAL = 3;

export function SetupChecklist({ profileComplete, productsCount, onAddProduct, onEditProfile }: Props) {
    const productsReady  = productsCount >= GOAL;
    const readyForOrders = profileComplete && productsReady;
    const progress       = Math.min(productsCount / GOAL, 1);

    const items = [
        {
            done:        profileComplete,
            label:       'Complete your profile',
            sub:         profileComplete
                             ? 'Bio and specialty added'
                             : 'Add a bio and specialty — customers read this before ordering',
            action:      profileComplete ? undefined : onEditProfile,
            actionLabel: 'Edit profile →',
        },
        {
            done:        productsReady,
            label:       `List ${GOAL} products`,
            sub:         productsReady
                             ? `${productsCount} products live in the marketplace`
                             : `${productsCount} of ${GOAL} — ${GOAL - productsCount} more to go`,
            action:      productsReady ? undefined : onAddProduct,
            actionLabel: 'Add product →',
        },
        {
            done:        readyForOrders,
            label:       'Ready for orders',
            sub:         readyForOrders
                             ? 'Your shop is live and discoverable'
                             : 'Complete the steps above to go fully live',
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="bg-white rounded-2xl border border-slate-200 p-6"
        >
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 text-sm">Setup progress</h3>
                {readyForOrders ? (
                    <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                        Shop live ✓
                    </span>
                ) : (
                    <span className="text-xs text-slate-400">
                        {[profileComplete, productsReady].filter(Boolean).length} / 2 done
                    </span>
                )}
            </div>

            {/* Products progress bar */}
            <div className="mb-5">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>Products listed</span>
                    <span className="font-semibold text-slate-700">{productsCount} / {GOAL}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-slate-900 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                    />
                </div>
            </div>

            <div className="space-y-3.5">
                {items.map(item => (
                    <div key={item.label} className="flex items-start gap-3">
                        {item.done
                            ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            : <Circle     className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
                        }
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-tight ${item.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                {item.label}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.sub}</p>
                            {item.action && (
                                <button
                                    onClick={item.action}
                                    className="text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors mt-1"
                                >
                                    {item.actionLabel}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
}
