import { Card, CardContent } from "@/components/ui/card";
import { ShineBorder } from "@/components/magicui/shine-border";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

const LOADING_MESSAGES = [
  'Reticulating riffs...',
  'Afinando microfonias...',
  'Sincronizando batidas cósmicas...',
  'Polindo harmonias...',
  'Carregando solos épicos...',
  'Misturando graves gravitacionais...',
  'Compondo refrões pegajosos...',
];

export default function LoadingPlaylistCard() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="relative overflow-hidden group cursor-wait">
      <ShineBorder shineColor={["#A07CFE", "#FE8FB5", "#FFBE7B"]} />
      <CardContent className="p-0 flex flex-col items-center justify-center aspect-square bg-gradient-to-br from-purple-50 to-blue-50">
        <Sparkles className="w-8 h-8 text-purple-500 mb-4 animate-pulse" />
        <p className="text-center text-sm font-medium text-gray-700 animate-pulse">
          {LOADING_MESSAGES[msgIndex]}
        </p>
      </CardContent>
    </Card>
  );
} 