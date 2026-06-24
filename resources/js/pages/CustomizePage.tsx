import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function CustomizePage() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/design', { replace: true });
    }, [navigate]);

    return null;
}
