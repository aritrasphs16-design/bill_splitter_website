import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

export const HoverEffect = ({
  items,
  className,
}: {
  items: {
    title: string;
    description: string | React.ReactNode;
    link?: string;
    icon?: string;
    iconClassName?: string;
    bgClassName?: string;
    textColor?: string;
  }[];
  className?: string;
}) => {
  let [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2  lg:grid-cols-4  py-10",
        className
      )}
    >
      {items.map((item, idx) => (
        <div
          key={item?.title}
          className="relative group  block p-2 h-full w-full"
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-slate-200 dark:bg-slate-800/[0.8] block  rounded-3xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <Card>
            {item.icon && (
               <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                 <span className={cn("material-symbols-outlined text-[120px]", item.iconClassName)}>{item.icon}</span>
               </div>
            )}
            <div className="relative z-10 flex flex-col gap-3">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", item.bgClassName)}>
                <span className={cn("material-symbols-outlined text-[18px]", item.iconClassName)}>{item.icon}</span>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#49454f] uppercase tracking-widest mb-1">{item.title}</p>
                <p className={cn("text-3xl font-bold", item.textColor)}>{item.description}</p>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
};

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl h-full w-full p-6 overflow-hidden bg-white border border-transparent dark:border-white/[0.2] group-hover:border-slate-200 relative z-20 shadow-sm transition-shadow",
        className
      )}
    >
      <div className="relative z-50">
        <div className="p-0">{children}</div>
      </div>
    </div>
  );
};
