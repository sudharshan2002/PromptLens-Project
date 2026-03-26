import { motion, AnimatePresence, Variants } from "motion/react";

export function LoadingScreen({ visible }: { visible: boolean }) {
  const containerVariants: Variants = {
    hidden: {},
    show: {},
    exit: {},
  };

  const panelVariants: Variants = {
    hidden: { y: "100%" },
    show: (i: number) => ({ 
      y: "0%", 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: i * 0.1 } 
    }),
    exit: (i: number) => ({ 
      y: "-100%", 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any, delay: 0.4 + i * 0.1 } // Waits 0.4s for logo to fade away
    }),
  };

  const logoVariants: Variants = {
    hidden: { opacity: 0, scale: 3 }, // Start massive for a stamp/reverse-punch effect
    show: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 20,
        delay: 0.9 // Punch in right as last panel finishes
      } 
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: { duration: 0.3, ease: "easeIn" as any } // Fades away quickly before panels move
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {/* Background behind panels to prevent any tearing */}
          <div className="absolute inset-0 bg-transparent pointer-events-none" />
          
          {[0, 1, 2, 3].map((index) => (
            <motion.div
              custom={index}
              key={index}
              className="flex-1 h-full bg-[#D1FF00]"
              variants={panelVariants}
              style={{
                // Prevent any microscopic gaps between flex items
                marginRight: index < 3 ? "-1px" : "0", 
              }}
            />
          ))}

          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            variants={logoVariants}
          >
            <img 
              src="/logo/Dark%20logo%20only.svg" 
              alt="Frigate Logo" 
              style={{ width: "clamp(60px, 15vw, 120px)", height: "auto" }} 
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
