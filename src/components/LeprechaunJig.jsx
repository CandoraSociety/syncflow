import { Button } from "@/components/ui/button";

const JIG_VIDEO_URL = "https://media.base44.com/videos/public/6a0025bc2848937e9e70bca5/087aaad98_Dancing_Leprechaun.mp4";

export default function LeprechaunJig({ onEnter }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <video
        src={JIG_VIDEO_URL}
        className="w-full max-w-3xl rounded-xl shadow-lg"
        autoPlay
        loop
        muted
        playsInline
        aria-label="Dancing leprechaun doing a jig around a pot of gold"
      />

      <p className="mt-6 text-lg font-semibold text-slate-700 font-heading">
        Top o' the mornin'! Welcome to Candora 💚
      </p>
      <Button onClick={onEnter} className="mt-4 gap-2" size="lg">
        Enter the App →
      </Button>
    </div>
  );
}