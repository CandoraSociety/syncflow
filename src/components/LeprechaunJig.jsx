import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ChromaKeyVideo from "@/components/ChromaKeyVideo";

const JIG_URL = "https://media.base44.com/videos/public/6a0025bc2848937e9e70bca5/c00ca7408_Magenta-Screen_Leprechaun.mp4";
const POT_URL = "https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/a35e455f2_generated_image.png";

const ORBIT_SECONDS = 8;

export default function LeprechaunJig({ onEnter }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4 overflow-hidden">
      <div className="relative w-80 h-80 md:w-[28rem] md:h-[28rem]">
        {/* Stationary pot of gold (white image background removed via blend) */}
        <img
          src={POT_URL}
          alt="Pot of gold"
          className="absolute left-1/2 top-1/2 w-44 md:w-56 -translate-x-1/2 -translate-y-1/2 mix-blend-multiply pointer-events-none"
        />

        {/* The leprechaun (transparent background) circles the pot as he jigs */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: ORBIT_SECONDS, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2">
            {/* Counter-rotation keeps him upright while orbiting */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: ORBIT_SECONDS, repeat: Infinity, ease: "linear" }}
            >
              <ChromaKeyVideo src={JIG_URL} className="w-32 md:w-40" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      <p className="mt-2 text-lg font-semibold text-slate-700 font-heading">
        Top o' the mornin'! Welcome to Candora 💚
      </p>
      <Button onClick={onEnter} className="mt-4 gap-2" size="lg">
        Enter the App →
      </Button>
    </div>
  );
}