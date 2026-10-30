import * as Dialog from '@radix-ui/react-dialog';
import { Ellipsis, Loader2, Star, X } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS_DOT, type DeskStatus } from './workspace';

/** The pieces the admin workspace's sections share: toasts, a confirm dialog, the side panel and popovers. */

// ─── Toasts and confirmation ─────────────────────────────────────────────────

interface ToastAction {
    label: string;
    run: () => void;
}

export interface ConfirmConfig {
    title: string;
    body: string;
    label: string;
    danger?: boolean;
    /** Ask for a reason of at least `minLength` characters before running. */
    reason?: { label: string; minLength: number };
    /** Resolves to an error to show in the dialog, or null when it worked. */
    run: (reason: string) => Promise<string | null>;
}

interface Desk {
    toast: (text: string, action?: ToastAction) => void;
    confirm: (config: ConfirmConfig) => void;
}

const DeskContext = createContext<Desk>({ toast: () => {}, confirm: () => {} });

/** A toast's Undo sits outside any open dialog; using it must not close that dialog. */
const keepOpenForToasts = (event: { target: EventTarget | null; preventDefault: () => void }) => {
    if (event.target instanceof Element && event.target.closest('.ka-toasts')) event.preventDefault();
};

export const useDesk = () => useContext(DeskContext);

export function DeskProvider({ children }: { children: ReactNode }) {
    const { t } = useTranslation();
    const [toasts, setToasts] = useState<{ id: number; text: string; action?: ToastAction }[]>([]);
    const [confirming, setConfirming] = useState<ConfirmConfig | null>(null);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [reasonError, setReasonError] = useState(false);
    const seq = useRef(0);
    const timers = useRef<number[]>([]);

    useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

    const dismiss = useCallback((id: number) => setToasts((list) => list.filter((x) => x.id !== id)), []);

    const toast = useCallback(
        (text: string, action?: ToastAction) => {
            const id = ++seq.current;
            setToasts((list) => [...list, { id, text, action }].slice(-3));
            timers.current.push(window.setTimeout(() => dismiss(id), action ? 6500 : 4000));
        },
        [dismiss],
    );

    const confirm = useCallback((config: ConfirmConfig) => {
        setConfirming(config);
        setReason('');
        setError('');
        setReasonError(false);
        setBusy(false);
    }, []);

    const close = () => {
        if (!busy) setConfirming(null);
    };

    const run = async () => {
        if (!confirming || busy) return;
        const trimmed = reason.trim();
        if (confirming.reason && trimmed.length < confirming.reason.minLength) {
            setError(t('adminDesk.reasonTooShort', { count: confirming.reason.minLength }));
            setReasonError(true);
            return;
        }
        setBusy(true);
        setError('');
        try {
            const failure = await confirming.run(trimmed);
            if (failure) setError(failure);
            else setConfirming(null);
        } catch {
            setError(t('adminDesk.networkError'));
        } finally {
            setBusy(false);
        }
    };

    return (
        <DeskContext.Provider value={{ toast, confirm }}>
            {children}

            <Dialog.Root open={confirming !== null} onOpenChange={(open) => !open && close()}>
                <Dialog.Portal>
                    <Dialog.Overlay className="ka-scope ka-dialog-back" />
                    <Dialog.Content role="alertdialog" className="ka-scope ka-dialog" onInteractOutside={keepOpenForToasts}>
                        {confirming && (
                            <>
                                <Dialog.Title asChild>
                                    <h2>{confirming.title}</h2>
                                </Dialog.Title>
                                <Dialog.Description>{confirming.body}</Dialog.Description>
                                {confirming.reason && (
                                    <div className="ka-section" style={{ marginTop: 8, gap: 6 }}>
                                        <label htmlFor="ka-confirm-reason" className="ka-lbl">
                                            {confirming.reason.label}
                                        </label>
                                        <textarea
                                            id="ka-confirm-reason"
                                            className="ka-area"
                                            rows={2}
                                            maxLength={500}
                                            style={{ minHeight: 64 }}
                                            aria-invalid={reasonError || undefined}
                                            value={reason}
                                            onChange={(e) => {
                                                setReason(e.target.value);
                                                setError('');
                                                setReasonError(false);
                                            }}
                                        />
                                    </div>
                                )}
                                {error && (
                                    <p role="alert" className="ka-err">
                                        {error}
                                    </p>
                                )}
                                <div className="ka-dialog-foot">
                                    <button type="button" className="ka-btn ka-btn-quiet" disabled={busy} onClick={close}>
                                        {t('adminDesk.keepAsIs')}
                                    </button>
                                    <button type="button" className={`ka-btn ${confirming.danger ? 'ka-btn-danger' : 'ka-btn-primary'}`} disabled={busy} onClick={() => void run()}>
                                        {busy && <Loader2 size={15} className="ka-spin" aria-hidden="true" />}
                                        {busy ? t('adminDesk.working') : confirming.label}
                                    </button>
                                </div>
                            </>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <div className="ka-scope ka-toasts" aria-live="polite">
                {toasts.map((item) => (
                    <div key={item.id} role="status" className="ka-toast">
                        <span>{item.text}</span>
                        {item.action && (
                            <button
                                type="button"
                                className="ka-toast-act"
                                onClick={() => {
                                    dismiss(item.id);
                                    item.action?.run();
                                }}
                            >
                                {item.action.label}
                            </button>
                        )}
                        <button type="button" className="ka-toast-x" aria-label={t('adminDesk.dismiss')} onClick={() => dismiss(item.id)}>
                            <X size={14} aria-hidden="true" />
                        </button>
                    </div>
                ))}
            </div>
        </DeskContext.Provider>
    );
}

// ─── Side panel ──────────────────────────────────────────────────────────────

export interface PanelMenuItem {
    label: string;
    danger?: boolean;
    onSelect: () => void;
}

export interface PanelTab<T extends string> {
    id: T;
    label: string;
    count?: number;
    hot?: boolean;
}

export function SidePanel<T extends string>({
    kicker,
    title,
    serif = false,
    status,
    meta,
    menu = [],
    tabs,
    tab,
    onTab,
    footer,
    onClose,
    children,
}: {
    kicker: string;
    title: string;
    serif?: boolean;
    status?: { dot: string; label: string } | null;
    meta?: ReactNode;
    menu?: PanelMenuItem[];
    tabs?: PanelTab<T>[];
    tab?: T;
    onTab?: (tab: T) => void;
    footer?: ReactNode;
    onClose: () => void;
    children: ReactNode;
}) {
    const { t } = useTranslation();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
                <Dialog.Overlay className="ka-scope ka-overlay" />
                <Dialog.Content
                    className="ka-scope ka-panel"
                    aria-describedby={undefined}
                    onInteractOutside={keepOpenForToasts}
                    onEscapeKeyDown={(event) => {
                        if (menuOpen) {
                            event.preventDefault();
                            setMenuOpen(false);
                        }
                    }}
                >
                    <div className="ka-panel-head">
                        <div className="ka-panel-top">
                            <div>
                                <span className="ka-lbl">{kicker}</span>
                                <Dialog.Title className={`ka-panel-title${serif ? ' is-serif' : ''}`}>{title}</Dialog.Title>
                            </div>
                            <div className="ka-panel-actions">
                                {menu.length > 0 && (
                                    <div style={{ position: 'relative' }}>
                                        <button
                                            type="button"
                                            className="ka-icon-btn"
                                            aria-label={t('adminDesk.moreActions')}
                                            aria-haspopup="menu"
                                            aria-expanded={menuOpen}
                                            onClick={() => setMenuOpen((open) => !open)}
                                        >
                                            <Ellipsis size={18} aria-hidden="true" />
                                        </button>
                                        <Popover open={menuOpen} onClose={() => setMenuOpen(false)} role="menu" className="ka-panel-menu" layer={62}>
                                            {menu.map((item) => (
                                                <button
                                                    key={item.label}
                                                    type="button"
                                                    role="menuitem"
                                                    className={`ka-mi${item.danger ? ' is-danger' : ''}`}
                                                    onClick={() => {
                                                        setMenuOpen(false);
                                                        item.onSelect();
                                                    }}
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </Popover>
                                    </div>
                                )}
                                <Dialog.Close className="ka-icon-btn" aria-label={t('adminDesk.close')}>
                                    <X size={18} aria-hidden="true" />
                                </Dialog.Close>
                            </div>
                        </div>
                        {(status || meta) && (
                            <div className="ka-panel-meta">
                                {status && <StatusLabel dot={status.dot} label={status.label} />}
                                {meta}
                            </div>
                        )}
                        {tabs && tab && onTab ? (
                            <div role="tablist" className="ka-ptabs">
                                {tabs.map((item) => (
                                    <button key={item.id} type="button" role="tab" className="ka-ptab" aria-selected={item.id === tab} onClick={() => onTab(item.id)}>
                                        {item.label}
                                        {!!item.count && <span className={`ka-n${item.hot ? ' is-hot' : ''}`}>{item.count}</span>}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="ka-panel-rule" />
                        )}
                    </div>
                    <div className="ka-panel-body">{children}</div>
                    {footer && <div className="ka-panel-foot">{footer}</div>}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}

// ─── Popover ─────────────────────────────────────────────────────────────────

/** A small floating box with a click-away backdrop; Escape closes it and focus moves in. */
export function Popover({
    open,
    onClose,
    className,
    label,
    role = 'dialog',
    layer = 40,
    children,
}: {
    open: boolean;
    onClose: () => void;
    className: string;
    label?: string;
    role?: 'dialog' | 'menu';
    layer?: number;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open || !ref.current) return;
        const target = role === 'menu' ? ref.current.querySelector<HTMLElement>('button') : ref.current;
        target?.focus({ preventScroll: true });
    }, [open, role]);

    if (!open) return null;

    return (
        <>
            <div aria-hidden="true" className="ka-pop-back" style={{ zIndex: layer }} onClick={onClose} />
            <div
                ref={ref}
                tabIndex={-1}
                role={role}
                aria-label={label}
                className={`ka-menu ${className}`}
                style={{ zIndex: layer + 1 }}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        event.stopPropagation();
                        onClose();
                    }
                }}
            >
                {children}
            </div>
        </>
    );
}

// ─── Small pieces ────────────────────────────────────────────────────────────

export function StatusLabel({ dot, label, muted = false }: { dot: string; label: string; muted?: boolean }) {
    return (
        <span className="ka-status" style={muted ? { color: 'var(--ka-text-3)' } : undefined}>
            <span aria-hidden="true" className="ka-dot" style={{ background: dot }} />
            <span className="ka-cut">{label}</span>
        </span>
    );
}

export function DeskStatusLabel({ status }: { status: DeskStatus }) {
    const { t } = useTranslation();
    return <StatusLabel dot={STATUS_DOT[status]} label={t(`adminDesk.status.${status}`)} muted={status === 'cancelled'} />;
}

export function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
    const { t } = useTranslation();
    return (
        <span className="ka-stars" role="img" aria-label={t('guarantee.starRating', { count: rating })}>
            {[1, 2, 3, 4, 5].map((k) => (
                <Star key={k} size={size} strokeWidth={1.6} aria-hidden="true" fill={k <= rating ? '#B07A1F' : 'none'} color={k <= rating ? '#B07A1F' : '#C9BFB1'} />
            ))}
        </span>
    );
}

export function Facts({ rows }: { rows: [string, ReactNode][] }) {
    return (
        <dl className="ka-kv">
            {rows.map(([label, value]) => (
                <div key={label} style={{ display: 'contents' }}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                </div>
            ))}
        </dl>
    );
}

export function Photos({ photos, label }: { photos: string[]; label: string }) {
    if (photos.length === 0) return null;
    return (
        <div className="ka-photos" role="list" aria-label={label}>
            {photos.map((url, i) => (
                <a key={url} role="listitem" href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`${label} ${i + 1}`} loading="lazy" />
                </a>
            ))}
        </div>
    );
}
