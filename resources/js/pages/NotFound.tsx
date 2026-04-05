import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="text-8xl font-black text-slate-200 mb-4 select-none">404</div>
                <h1 className="text-2xl font-bold text-slate-900 mb-3">Page not found</h1>
                <p className="text-slate-500 mb-8 max-w-sm">
                    The page you're looking for doesn't exist. Let's get you back on track.
                </p>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 bg-slate-900 text-white font-medium px-6 py-3 rounded-xl hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>
            </motion.div>
        </div>
    );
}
