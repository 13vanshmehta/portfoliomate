import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { signup, verifyOtp, getFirms } from '../api/auth';
import { Loader2, CheckCircle2 } from 'lucide-react';

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits'),
});

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Details, 2 = Firm Select, 3 = OTP Verify
  const [firms, setFirms] = useState([]);
  const [selectedFirm, setSelectedFirm] = useState('');
  const [error, setError] = useState('');
  const [loadingFirms, setLoadingFirms] = useState(false);
  const [userData, setUserData] = useState(null);

  const { register: registerDetails, handleSubmit: handleSubmitDetails, formState: { errors: errorsDetails, isSubmitting: isSubmittingDetails } } = useForm({
    resolver: zodResolver(signupSchema)
  });

  const { register: registerOtp, handleSubmit: handleSubmitOtp, formState: { errors: errorsOtp, isSubmitting: isSubmittingOtp } } = useForm({
    resolver: zodResolver(otpSchema)
  });

  useEffect(() => {
    if (step === 2) {
      setLoadingFirms(true);
      getFirms()
        .then((res) => {
          setFirms(res.data.data);
          setLoadingFirms(false);
        })
        .catch(() => setLoadingFirms(false));
    }
  }, [step]);

  const onDetailsSubmit = (data) => {
    setUserData(data);
    setStep(2); // Proceed to firm selection
  };

  const onFirmSelect = async () => {
    if (!selectedFirm) {
      setError('Please select a firm');
      return;
    }
    setError('');
    try {
      await signup({ ...userData, firmId: selectedFirm });
      setStep(3); // Proceed to OTP verification
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create account. Try again.');
    }
  };

  const onOtpSubmit = async (data) => {
    try {
      setError('');
      await verifyOtp({ email: userData.email, otp: data.otp });
      // On success, redirect to login page for them to login
      navigate('/auth/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-1 flex w-full h-full"
    >
      <div className="absolute top-4 right-4 lg:top-8 lg:right-8 text-sm flex items-center justify-end z-10 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
        <span className="text-gray-500">Already have an account? </span>
        <Link to="/auth/login" className="text-gray-900 bg-gray-50 hover:bg-gray-100 px-5 py-2.5 rounded-full transition-colors ml-3 font-semibold text-[13px]">
          Sign in
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 lg:px-8 w-full max-w-md mx-auto pt-14 lg:mt-4">
        <div className="text-center mb-6">
          <h1 className="text-[1.75rem] sm:text-[2rem] font-bold text-gray-900 mb-2">Create an account</h1>
          <p className="text-gray-500 text-[0.85rem] sm:text-[0.95rem]">Welcome! Please fill in the details to get started.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmitDetails(onDetailsSubmit)} 
              className="space-y-4"
              autoComplete="off"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input {...registerDetails('firstName')} type="text" placeholder="First Name" autoComplete="off" className={`w-full px-4 py-3 rounded-lg border ${errorsDetails.firstName ? 'border-red-500' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} />
                  {errorsDetails.firstName && <p className="text-red-500 text-xs mt-1">{errorsDetails.firstName.message}</p>}
                </div>
                <div>
                  <input {...registerDetails('lastName')} type="text" placeholder="Last Name" autoComplete="off" className={`w-full px-4 py-3 rounded-lg border ${errorsDetails.lastName ? 'border-red-500' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} />
                  {errorsDetails.lastName && <p className="text-red-500 text-xs mt-1">{errorsDetails.lastName.message}</p>}
                </div>
              </div>
              
              <div>
                <input {...registerDetails('email')} type="email" placeholder="Email Address" autoComplete="off" className={`w-full px-4 py-3 rounded-lg border ${errorsDetails.email ? 'border-red-500' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} />
                {errorsDetails.email && <p className="text-red-500 text-xs mt-1">{errorsDetails.email.message}</p>}
              </div>

              <div>
                <input {...registerDetails('password')} type="password" placeholder="Password" autoComplete="new-password" className={`w-full px-4 py-3 rounded-lg border ${errorsDetails.password ? 'border-red-500' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} />
                {errorsDetails.password && <p className="text-red-500 text-xs mt-1">{errorsDetails.password.message}</p>}
              </div>

              <button type="submit" className="w-full bg-[#1A4BFE] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center transition-colors">
                Continue to Firm Selection
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select your Organization</label>
                {loadingFirms ? (
                  <div className="flex items-center text-gray-500 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading firms...
                  </div>
                ) : (
                  <select 
                    value={selectedFirm} 
                    onChange={(e) => setSelectedFirm(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Choose a Firm --</option>
                    {firms.map((firm) => (
                      <option key={firm.firmId} value={firm.firmId}>{firm.firmName || firm.firmEmailId} ({firm.description})</option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors">
                  Back
                </button>
                <button type="button" onClick={onFirmSelect} className="w-full bg-[#1A4BFE] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
                  Register
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.form 
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSubmitOtp(onOtpSubmit)} 
              className="space-y-4 text-center"
            >
              <div className="mb-4 flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg">Verify your email</h3>
                <p className="text-gray-500 text-sm mt-1">We've sent a 6-digit OTP to {userData?.email}</p>
              </div>
              
              <div>
                <input 
                  {...registerOtp('otp')} 
                  type="text" 
                  placeholder="Enter 6-digit OTP" 
                  maxLength={6}
                  className={`w-full text-center tracking-[0.5em] font-mono text-xl px-4 py-3 rounded-lg border ${errorsOtp.otp ? 'border-red-500' : 'border-gray-200'} outline-none focus:ring-2 focus:ring-blue-500`} 
                />
                {errorsOtp.otp && <p className="text-red-500 text-xs mt-1">{errorsOtp.otp.message}</p>}
              </div>

              <button type="submit" disabled={isSubmittingOtp} className="w-full bg-[#1A4BFE] hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center transition-colors">
                {isSubmittingOtp ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Address'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}