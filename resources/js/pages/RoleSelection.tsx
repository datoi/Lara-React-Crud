import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { User, Scissors, ArrowRight } from 'lucide-react';

export default function RoleSelection() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
                    <Link to="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
                        Kere
                    </Link>
                </div>
            </nav>

            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-2xl"
                >
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-slate-900 mb-3">Sign in to Kere</h1>
                        <p className="text-slate-500">Choose your role to continue.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                        {/* Customer */}
                        <motion.button
                            whileHover={{ y: -4, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/login/customer')}
                            className="group bg-white rounded-2xl border-2 border-slate-200 p-8 text-left hover:border-slate-900 hover:shadow-xl transition-all"
                        >
                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-slate-900 transition-colors">
                                <User className="w-7 h-7 text-slate-600 group-hover:text-white transition-colors" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">I'm a Customer</h2>
                            <p className="text-slate-500 text-sm leading-relaxed mb-5">
                                I want to order custom clothing from local Georgian tailors.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-900 group-hover:gap-3 transition-all">
                                Sign In <ArrowRight className="w-4 h-4" />
                            </div>
                        </motion.button>

                        {/* Tailor */}
                        <motion.button
                            whileHover={{ y: -4, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/login/tailor')}
                            className="group bg-slate-900 rounded-2xl border-2 border-slate-900 p-8 text-left hover:bg-slate-800 hover:shadow-xl transition-all"
                        >
                            <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-slate-600 transition-colors">
                                <Scissors className="w-7 h-7 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">I'm a Tailor</h2>
                            <p className="text-slate-400 text-sm leading-relaxed mb-5">
                                I'm a skilled tailor and I want to join the Kere platform to grow my business.
                            </p>
                            <div className="flex items-center gap-2 text-sm font-medium text-white group-hover:gap-3 transition-all">
                                Sign In <ArrowRight className="w-4 h-4" />
                            </div>
                        </motion.button>
                    </div>

                    <p className="text-center text-sm text-slate-400 mt-8">
                        By continuing, you agree to our{' '}
                        <Link to="/" className="underline hover:text-slate-600">Terms of Service</Link>{' '}
                        and{' '}
                        <Link to="/" className="underline hover:text-slate-600">Privacy Policy</Link>.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
