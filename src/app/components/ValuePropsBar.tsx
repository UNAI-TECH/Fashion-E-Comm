import { motion } from 'motion/react';
import { Tag, Award, Zap, ShieldCheck } from 'lucide-react';

export function ValuePropsBar() {
  const valueProps = [
    {
      id: 1,
      icon: Tag,
      title: 'Low Cost',
      subtitle: 'Best Prices Guaranteed',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 2,
      icon: Award,
      title: 'High Quality',
      subtitle: 'Premium Handcrafted Fabrics',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 3,
      icon: Zap,
      title: 'Fast Delivery',
      subtitle: 'Express Nationwide Shipping',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 4,
      icon: ShieldCheck,
      title: 'Trusted Brand',
      subtitle: '100% Authentic Guarantee',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <section className="w-full bg-gradient-to-r from-[#FFF0F5] via-white to-[#FFF0F5] border-y border-rose-100/60 py-3.5 sm:py-4 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 justify-items-center">
          {valueProps.map((prop, idx) => {
            const Icon = prop.icon;
            return (
              <motion.div
                key={prop.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ scale: 1.03, y: -2 }}
                className="w-full max-w-xs flex items-center gap-3 px-3.5 py-2.5 bg-white/90 backdrop-blur-sm rounded-2xl border border-rose-100/80 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-all"
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${prop.badgeColor}`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-black text-gray-900 tracking-tight leading-tight whitespace-nowrap">
                    {prop.title}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 truncate mt-0.5">
                    {prop.subtitle}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
