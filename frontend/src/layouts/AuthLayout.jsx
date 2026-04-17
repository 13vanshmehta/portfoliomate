import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

const images = [
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=500&q=60', // 0 Office meeting
  'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=500&q=60', // 1 People discussing
  'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=500&q=60', // 2 Working at desk
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=500&q=60', // 3 Team high five
  'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=500&q=60', // 4 Woman smiling
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=500&q=60', // 5 Bookshelf / library
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=60'  // 6 Office wide
];

export default function AuthLayout() {
  return (
    <div className="min-h-[100dvh] bg-[#E9F3F0] p-4 lg:p-6 flex items-center justify-center font-sans">
      <div className="w-full max-w-[1400px] h-full lg:h-[90vh] min-h-[550px] md:min-h-[700px] bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-xl flex overflow-hidden p-2 lg:p-3 relative">
        
        {/* Left Side: Interactive Flex Bento Grid */}
        <div className="hidden lg:flex w-full lg:w-[55%] xl:w-[60%] bg-[#111111] p-3 rounded-[1.75rem] lg:rounded-[2.25rem] gap-3 relative overflow-hidden">
          
          {/* Column 1 */}
          <div className="flex flex-col gap-3 w-1/3 h-full">
            <motion.div whileHover={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="h-[30%] rounded-[1.25rem] overflow-hidden">
              <img src={images[3]} className="w-full h-full object-cover" alt="grid" />
            </motion.div>
            <motion.div whileHover={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="h-[40%] rounded-[1.25rem] overflow-hidden relative">
              <img src={images[4]} className="w-full h-full object-cover opacity-90" alt="grid" />
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            </motion.div>
            <motion.div whileHover={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="h-[30%] rounded-[1.25rem] overflow-hidden">
              <img src={images[5]} className="w-full h-full object-cover" alt="grid" />
            </motion.div>
          </div>

          {/* Column 2 */}
          <div className="flex flex-col gap-3 w-1/3 h-full pt-10">
            <motion.div whileHover={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="h-[35%] bg-[#E85D45] rounded-[1.25rem] p-6 xl:p-8 text-white flex flex-col justify-center shadow-inner">
              <h2 className="text-5xl xl:text-6xl font-bold mb-2 tracking-tight">41%</h2>
              <p className="text-white/90 text-sm xl:text-base font-medium leading-snug">of recruiters say entry-level positions are the hardest to fill.</p>
            </motion.div>
            <motion.div whileHover={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="h-[30%] rounded-[1.25rem] overflow-hidden">
              <img src={images[6]} className="w-full h-full object-cover grayscale-[30%]" alt="grid" />
            </motion.div>
            <motion.div whileHover={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="h-[35%] bg-[#2DCA73] rounded-[1.25rem] p-6 xl:p-8 text-white flex flex-col justify-center shadow-inner">
              <h2 className="text-5xl xl:text-6xl font-bold mb-2 tracking-tight">76%</h2>
              <p className="text-white/90 text-sm xl:text-base font-medium leading-snug">of hiring managers admit attracting the right job candidates is their greatest challenge.</p>
            </motion.div>
          </div>

          {/* Column 3 */}
          <div className="flex flex-col gap-3 w-1/3 h-full pb-10">
            <motion.div whileHover={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="h-[40%] rounded-[1.25rem] overflow-hidden">
              <img src={images[1]} className="w-full h-full object-cover" alt="grid" />
            </motion.div>
            <motion.div whileHover={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="h-[30%] rounded-[1.25rem] overflow-hidden">
              <img src={images[0]} className="w-full h-full object-cover" alt="grid" />
            </motion.div>
            <motion.div whileHover={{ scale: 0.98 }} transition={{ duration: 0.2 }} className="h-[30%] rounded-[1.25rem] overflow-hidden">
              <img src={images[2]} className="w-full h-full object-cover" alt="grid" />
            </motion.div>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col relative px-8 py-10 lg:px-12 lg:py-12 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
