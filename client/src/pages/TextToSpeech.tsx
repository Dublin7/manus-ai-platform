import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Volume2, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const VOICES = [
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "onyx", name: "Onyx" },
  { id: "nova", name: "Nova" },
  { id: "shimmer", name: "Shimmer" },
];

export default function TextToSpeech() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: history } = trpc.tts.getHistory.useQuery(undefined, {
    enabled: !!user,
  });

  const generateMutation = trpc.tts.generate.useMutation();

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync({
        text,
        voice,
      });
    } catch (error) {
      console.error("Failed to generate speech:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Generation Form */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Text-to-Speech</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Voice</label>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Text</label>
            <textarea
              placeholder="Enter the text you want to convert to speech..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {text.length} characters
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Generate Speech
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* History */}
      <div>
        <h3 className="text-xl font-bold mb-4">Generation History</h3>
        <div className="space-y-3">
          {history?.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm line-clamp-2">{item.text}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {item.voice} • {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {item.audioUrl && (
                  <div className="flex gap-2 ml-4">
                    <audio
                      controls
                      src={item.audioUrl}
                      className="h-8"
                    />
                    <a
                      href={item.audioUrl}
                      download
                      className="p-2 hover:bg-muted rounded-lg"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
