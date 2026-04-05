export interface AuthUser {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    phone: string;
    role: 'customer' | 'tailor';
}

const USER_KEY = 'kere_user';
const TOKEN_KEY = 'kere_token';

export function getAuthUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem(USER_KEY);
        return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
        return null;
    }
}

export function getAuthToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

export function saveAuth(user: AuthUser, token: string): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
}
