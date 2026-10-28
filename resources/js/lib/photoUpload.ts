export interface UploadResult {
    status: number;
    /** Where the photo can be fetched, when the server kept it */
    url?: string;
}

/**
 * One photo sent to the server. Throws only when the request never got an
 * answer. Customer uploads (`/api/uploads`) answer with `file_url`, a tailor's
 * order photos (`/api/upload/order-photo`) with `url`.
 */
export async function uploadPhoto(file: File, token: string, endpoint = '/api/uploads', field = 'file'): Promise<UploadResult> {
    const form = new FormData();
    form.append(field, file);
    const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: form,
    });
    if (!res.ok) return { status: res.status };
    const data = (await res.json()) as { file_url?: string; url?: string };
    return { status: res.status, url: data.file_url ?? data.url };
}
