import fs from 'fs';
import path from 'path';

const bannerFile = path.resolve('c:/Users/SUPER/Fashion-E-Comm/src/app/components/MotionBanner.tsx');
let mbContent = fs.readFileSync(bannerFile, 'utf-8');

const target = `<section className="relative w-full min-h-[320px] md:min-h-0 md:aspect-[19/8] flex flex-col md:flex-row items-center overflow-hidden bg-[#F1CBD3] py-16 md:py-0">
      {/* Background Image - hidden on mobile, right-aligned on desktop */}
      <div className="hidden md:block absolute bottom-0 right-0 w-full h-[45%] md:h-full md:w-[60%] pointer-events-none z-0">
        <img
          src="/hero_new.png"
          alt="Fashion Collection"
          className="w-full h-full object-contain object-bottom md:object-right transform scale-120 origin-bottom-right"
        />
      </div>`;
      
const replacement = `<section 
      className="relative w-full min-h-[260px] md:min-h-0 md:aspect-[21/7] lg:aspect-[24/7] flex flex-col md:flex-row items-center overflow-hidden py-10 md:py-0"
      style={{ 
        backgroundImage: 'url("/hero_fashion_phone.png")', 
        backgroundSize: 'contain', 
        backgroundPosition: 'right center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#F1CBD3'
      }}
    >`;

if (mbContent.includes(target)) {
  mbContent = mbContent.replace(target, replacement);
  fs.writeFileSync(bannerFile, mbContent, 'utf-8');
  console.log('MotionBanner updated successfully.');
} else {
  console.log('MotionBanner target not found!');
}
