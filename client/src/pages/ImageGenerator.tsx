import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ImageGenerator() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("flux");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: history } = trpc.image.getHistory.useQuery(undefined, {
    enabled: !!user,
  });

  const generateMutation = trpc.image.generate.useMutation();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync({
        prompt,
        model: model as "flux" | "imagen" | "gpt-image-1",
      });
    } catch (error) {
      console.error("Failed to generate image:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Generation Form */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Image Generator</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Model</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="flux">FLUX</SelectItem>
                <SelectItem value="imagen">Imagen</SelectItem>
                <SelectItem value="gpt-image-1">GPT-Image-1</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <textarea
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Image"
            )}
          </Button>
        </div>
      </Card>

      {/* History */}
      <div>
        <h3 className="text-xl font-bold mb-4">Generation History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history?.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              {item.imageUrl && (
                <div className="relative group">
                  <img
                    src={item.imageUrl}
                    alt={item.prompt}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={item.imageUrl}
                      download
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
              <div className="p-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.prompt}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {item.model} • {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
