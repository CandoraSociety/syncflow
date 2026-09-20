import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const LEPRECHAUN_URL = "https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/47eaffe85_generated_image.png";
const POT_URL = "https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/a35e455f2_generated_image.png";

export default function LeprechaunJig({ onEnter }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="relative w-72 h-72 md:w-96 md:h-96">
        {/* Pot of gold in the center */}
        <motion.img
          src={POT_URL}
          alt="Pot of gold"
          className="absolute left-1/2 top-1/2 w-32 md:w-40 -translate-x-1/2 -translate-y-1/2 drop-shadow-lg"
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Leprechaun orbiting the pot (jig) */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* Counter-rotation keeps him upright while he circles the pot */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              {/* The jig: hop, kick and sway */}
              <motion.div
                animate={{ y: [0, -18, 0], rotate: [-6, 6, -6] }}
                transition={{ duration: 0.45, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src={LEPRECHAUN_URL}
                  alt="Dancing leprechaun"
                  className="w-24 md:w-28 mix-blend-multiply"
                />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <p className="mt-6 text-lg font-semibold text-slate-700 font-heading">
        Top o' the mornin'! Welcome to Candora 💚
      </p>
      <Button onClick={onEnter} className="mt-4 gap-2" size="lg">
        Enter the App →
      </Button>
    </div>
  );
}