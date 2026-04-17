import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { login, googleSignIn, getFirms } from '../api/auth';
import { Loader2 } from 'lucide-react';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  // States for Firm Selection on first-time Google Sign-in
  const [requiresFirm, setRequiresFirm] = useState(false);
  const [firms, setFirms] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState('');
  const [loadingFirms, setLoadingFirms] = useState(false);
  const [googleToken, setGoogleToken] = useState('');
  const [isSubmittingGoogle, setIsSubmittingGoogle] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      const res = await login({ email: data.email, password: data.password });
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/portfoliomate/announcement');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsSubmittingGoogle(true);
      Object.assign(googleProvider.customParameters, { prompt: 'select_account' });
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      try {
        const res = await googleSignIn({ idToken });
        const { token, user } = res.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/portfoliomate/announcement');
      } catch (signInErr) {
        if (signInErr.response?.data?.code === 'FIRM_REQUIRED') {
          // First-time Google user needs to select a firm
          setGoogleToken(idToken);
          setLoadingFirms(true);
          setRequiresFirm(true);
          getFirms()
            .then((res) => {
              setFirms(res.data.data);
              setLoadingFirms(false);
            })
            .catch(() => {
              setLoadingFirms(false);
              setError('Failed to load firms. Please refresh and try again.');
            });
        } else {
          throw signInErr; // rethrow to be caught by outer catch
        }
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.response?.data?.message || err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  const handleCompleteGoogleSignIn = async () => {
    if (!selectedFirm) {
      setError('Please select an organization to proceed');
      return;
    }
    
    try {
      setError('');
      setIsSubmittingGoogle(true);
      const res = await googleSignIn({ idToken: googleToken, firmId: selectedFirm });
      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/portfoliomate/announcement');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete sign in. Please try again.');
    } finally {
      setIsSubmittingGoogle(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col justify-center max-w-[420px] w-full mx-auto h-full"
    >
      <div className="absolute top-4 right-4 lg:top-8 lg:right-8 text-sm font-medium flex items-center justify-end z-10 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
        <span className="text-gray-500">Don't have an account? </span>
        <Link to="/auth/signup" className="text-gray-900 bg-gray-50 hover:bg-gray-100 px-5 py-2.5 rounded-full transition-colors ml-3 font-semibold text-[13px]">
          Sign up
        </Link>
      </div>

      <div className="text-center mb-6 mt-10">
        <h1 className="text-[1.75rem] sm:text-[2rem] lg:text-[2.25rem] font-bold text-gray-900 mb-2 sm:mb-3 font-sans tracking-tight leading-tight">Sign in to Jobsly</h1>
        <p className="text-[#6B7280] text-[0.85rem] sm:text-[0.95rem] leading-relaxed mx-auto">
          Welcome to Jobsly, please enter your login details below to using the app.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm text-center font-medium border border-red-100">
          {error}
        </div>
      )}

      {requiresFirm ? (
        <motion.div
           key="firmSelect"
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           className="space-y-4"
        >
          <div className="mb-4">
            <label className="block text-[0.95rem] font-semibold text-gray-900 mb-2">Select your Organization</label>
            <p className="text-gray-500 text-sm mb-4">You're almost there! Choose your firm to complete sign-in.</p>
            {loadingFirms ? (
              <div className="flex items-center justify-center p-4 text-gray-500 text-sm border rounded-xl border-gray-200">
                <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading firms...
              </div>
            ) : (
              <select 
                value={selectedFirm} 
                onChange={(e) => setSelectedFirm(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 text-[0.95rem] outline-none focus:border-[#1A4BFE] focus:ring-4 focus:ring-[#1A4BFE]/10 transition-all appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236B7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
              >
                <option value="">-- Choose a Firm --</option>
                {firms.map((firm) => (
                  <option key={firm.firmId} value={firm.firmId}>{firm.firmName || firm.firmEmailId} {firm.description ? `(${firm.description})` : ''}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={() => { setRequiresFirm(false); setGoogleToken(''); }} 
              className="w-1/3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-4 rounded-xl transition-colors shadow-sm"
              disabled={isSubmittingGoogle}
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={handleCompleteGoogleSignIn} 
              className="w-2/3 bg-[#1A4BFE] hover:bg-[#153DCC] text-white font-semibold py-4 rounded-xl transition-colors shadow-[0_6px_20px_rgba(26,75,254,0.25)] flex justify-center items-center gap-2 disabled:opacity-70"
              disabled={isSubmittingGoogle || loadingFirms || !selectedFirm}
            >
              {isSubmittingGoogle ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Sign-in'}
            </button>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
          <div>
            <input 
              {...register('email')}
              type="email" 
              placeholder="Email Address" 
              autoComplete="off"
              className={`w-full px-5 py-4 rounded-xl border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'} text-[0.95rem] outline-none transition-all placeholder:text-gray-400 focus:border-[#1A4BFE] focus:ring-4 focus:ring-[#1A4BFE]/10`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email.message}</p>}
          </div>

          <div>
            <input 
              {...register('password')}
              type="password" 
              placeholder="Password" 
              autoComplete="new-password"
              className={`w-full px-5 py-4 rounded-xl border ${errors.password ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'} text-[0.95rem] outline-none transition-all placeholder:text-gray-400 focus:border-[#1A4BFE] focus:ring-4 focus:ring-[#1A4BFE]/10`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.password.message}</p>}
          </div>

          <div className="text-right mt-6 mb-6">
            <a href="#" className="flex justify-end w-full text-[0.85rem] font-bold text-[#1A4BFE] hover:text-blue-700 tracking-wide transition-colors">
              Forgot the password?
            </a>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#1A4BFE] hover:bg-[#153DCC] text-white font-semibold py-4 rounded-xl flex items-center justify-center transition-colors shadow-[0_6px_20px_rgba(26,75,254,0.25)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
          </motion.button>

          <div className="relative flex items-center justify-center my-8">
            <div className="border-t border-gray-100 w-full"></div>
            <span className="bg-white px-4 text-[0.7rem] font-semibold text-gray-400 absolute">OR</span>
          </div>

          <motion.button 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="button" 
            onClick={handleGoogleSignIn}
            disabled={isSubmittingGoogle}
            className="w-full bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-800 font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmittingGoogle ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            )}
            {isSubmittingGoogle ? 'Continuing...' : 'Continue with Google'}
          </motion.button>
        </form>
      )}
    </motion.div>
  );
}
