import { motion } from 'motion/react';
import { CheckCircle, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    profileComplete: boolean;
    productsCount:   number;
    onAddProduct:    () => void;
    onEditProfile:   () => void;
}

const GOAL = 3;

export function SetupChecklist({ profileComplete, productsCount, onAddProduct, onEditProfile }: Props) {
    const { t } = useTranslation();

    const productsReady  = productsCount >= GOAL;
    const readyForOrders = profileComplete && productsReady;
    const progress       = Math.min(productsCount / GOAL, 1);
    const doneCt         = [profileComplete, productsReady].filter(Boolean).length;

    const items = [
        {
            done:        profileComplete,
            label:       t('tailorComponents.completeProfileItem'),
            sub:         profileComplete
                             ? t('tailorComponents.profileDone')
                             : t('tailorComponents.profileTodo'),
            action:      profileComplete ? undefined : onEditProfile,
            actionLabel: t('tailorComponents.editProfileLink'),
        },
        {
            done:        productsReady,
            label:       t('tailorComponents.listProducts', { goal: GOAL }),
            sub:         productsReady
                             ? t('tailorComponents.productsLiveDone', { count: productsCount })
                             : t('tailorComponents.productsProgress', { count: productsCount, goal: GOAL, remaining: GOAL - productsCount }),
            action:      productsReady ? undefined : onAddProduct,
            actionLabel: t('tailorComponents.addProductLink'),
        },
        {
            done:        readyForOrders,
            label:       t('tailorComponents.readyForOrders'),
            sub:         readyForOrders
                             ? t('tailorComponents.shopLiveDone')
                             : t('tailorComponents.shopLiveTodo'),
        },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl border border-slate-200 p-6"
        >
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 text-sm">{t('tailorComponents.setupProgress')}</h3>
                {readyForOrders ? (
                    <span className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
                        {t('tailorComponents.shopLive')}
                    </span>
                ) : (
                    <span className="text-xs text-slate-400">
                        {t('tailorComponents.doneCount', { done: doneCt })}
                    </span>
                )}
            </div>

            {/* Products progress bar */}
            <div className="mb-5">
                <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>{t('tailorComponents.productsListedProgress')}</span>
                    <span className="font-semibold text-slate-700">{productsCount} / {GOAL}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-brand rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                    />
                </div>
            </div>

            <div className="space-y-3.5">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                        {item.done
                            ? <CheckCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
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
                                    className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors mt-1"
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
