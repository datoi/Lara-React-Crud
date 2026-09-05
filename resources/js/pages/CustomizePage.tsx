import { Navigate, useParams, useSearchParams } from 'react-router';

/**
 * The old single-screen customizer's URL.
 *
 * The garment is now a step of the guided designer rather than a page of its
 * own, so this keeps every link that predates it working — My Designs' "edit",
 * shared links, and anything a customer bookmarked — by naming the same garment
 * in the designer's query. The saved design travels with it.
 */
export default function CustomizePage() {
    const { slug } = useParams<{ slug: string }>();
    const [searchParams] = useSearchParams();

    if (!slug) return <Navigate to="/design" replace />;

    const params = new URLSearchParams();
    params.set('garment', slug);
    const design = searchParams.get('design');
    if (design) params.set('design', design);

    return <Navigate to={`/design?${params.toString()}`} replace />;
}
