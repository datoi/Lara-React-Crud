import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { COUNTRIES, countryFlag, type Country } from '../data/countries';

interface Props {
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
    placeholder?: string;
}

const DEFAULT_COUNTRY = COUNTRIES[0]; // Georgia

// Split a stored E.164-ish value (e.g. "+995555123456") back into { country, localNumber }
// for display — only needed when a value arrives from outside (unused today but keeps the
// component correct if a parent ever passes in an existing phone number).
function splitValue(value: string): { country: Country; localNumber: string } {
    const match = COUNTRIES
        .filter(c => value.startsWith(c.dialCode))
        .sort((a, b) => b.dialCode.length - a.dialCode.length)[0];
    if (match) {
        return { country: match, localNumber: value.slice(match.dialCode.length) };
    }
    return { country: DEFAULT_COUNTRY, localNumber: value.replace(/^\+/, '') };
}

export function PhoneInput({ value, onChange, error, placeholder }: Props) {
    const { t } = useTranslation();
    const initial = useMemo(() => splitValue(value), []); // eslint-disable-line react-hooks/exhaustive-deps

    const [country, setCountry] = useState<Country>(initial.country);
    const [localNumber, setLocalNumber] = useState(initial.localNumber);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return COUNTRIES;
        return COUNTRIES.filter(c =>
            c.name.toLowerCase().includes(q) || c.dialCode.includes(q)
        );
    }, [query]);

    const emitChange = (nextCountry: Country, nextLocalNumber: string) => {
        const digits = nextLocalNumber.replace(/\D/g, '');
        onChange(digits ? `${nextCountry.dialCode}${digits}` : '');
    };

    const selectCountry = (c: Country) => {
        setCountry(c);
        setOpen(false);
        setQuery('');
        emitChange(c, localNumber);
    };

    const handleLocalNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const next = e.target.value.replace(/[^\d\s]/g, '');
        setLocalNumber(next);
        emitChange(country, next);
    };

    return (
        <div className="flex gap-2" ref={ref}>
            <div className="relative flex-shrink-0">
                <button
                    type="button"
                    onClick={() => setOpen(o => !o)}
                    className={`h-full flex items-center gap-1.5 border rounded-lg px-2.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${error ? 'border-destructive' : 'border-slate-200'}`}
                >
                    <span className="text-base leading-none">{countryFlag(country.iso2)}</span>
                    <span className="text-slate-700">{country.dialCode}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {open && (
                    <div className="absolute z-20 mt-1 w-72 max-h-80 overflow-hidden rounded-lg bg-white border border-slate-200 shadow-lg flex flex-col">
                        <div className="p-2 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
                            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={t('register.phoneCountrySearchPlaceholder')}
                                className="w-full text-sm focus:outline-none"
                            />
                        </div>
                        <div className="overflow-y-auto">
                            {filtered.length === 0 ? (
                                <p className="px-3 py-3 text-sm text-slate-400">{t('register.phoneCountryNoResults')}</p>
                            ) : (
                                filtered.map(c => (
                                    <button
                                        key={c.iso2}
                                        type="button"
                                        onClick={() => selectCountry(c)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors ${c.iso2 === country.iso2 ? 'bg-slate-50' : ''}`}
                                    >
                                        <span className="text-base leading-none">{countryFlag(c.iso2)}</span>
                                        <span className="flex-1 text-slate-700 truncate">{c.name}</span>
                                        <span className="text-slate-400">{c.dialCode}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            <input
                type="tel"
                value={localNumber}
                onChange={handleLocalNumberChange}
                placeholder={placeholder ?? t('register.phoneNumberPlaceholder')}
                className={`flex-1 min-w-0 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors ${error ? 'border-destructive' : 'border-slate-200'}`}
            />
        </div>
    );
}
