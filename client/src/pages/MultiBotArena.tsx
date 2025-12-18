import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const AVAILABLE_MODELS = ["gpt-4", "gpt-3.5-turbo", "claude-3-opus", "claude-3-sonnet"];

export default function MultiBotArena() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>(["gpt-4", "claude-3-opus"]);
  const [isComparing, setIsComparing] = useState(false);

  const { data: sessions } = trpc.multiBot.getSessions.useQuery(undefined, {
    enabled: !!user,
  });

  const compareMutation = trpc.multiBot.compare.useMutation();

  const handleToggleModel = (model: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(model)) {
        return prev.filter((m) => m !== model);
      } else if (prev.length < 4) {
        return [...prev, model];
      }
      return prev;
    });
  };

  const handleCompare = async () => {
    if (!prompt.trim() || selectedModels.length < 2) return;

    setIsComparing(true);
    try {
      await compareMutation.mutateAsync({
        prompt,
        models: selectedModels,
      });
    } catch (error) {
      console.error("Failed to compare models:", error);
    } finally {
      setIsComparing(false);
    }
  };

  const latestSession = sessions?.[0];

  return (
    <div className="space-y-6 p-6">
      {/* Comparison Form */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Multi-Bot Arena</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-3">Select Models (2-4)</label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_MODELS.map((model) => (
                <label key={model} className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox
                    checked={selectedModels.includes(model)}
                    onCheckedChange={() => handleToggleModel(model)}
                    disabled={selectedModels.length === 4 && !selectedModels.includes(model)}
                  />
                  <span className="text-sm">{model}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Prompt</label>
            <textarea
              placeholder="Enter a prompt to compare responses from different models..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={4}
            />
          </div>

          <Button
            onClick={handleCompare}
            disabled={isComparing || !prompt.trim() || selectedModels.length < 2}
            className="w-full"
            size="lg"
          >
            {isComparing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Comparing...
              </>
            ) : (
              "Compare Models"
            )}
          </Button>
        </div>
      </Card>

      {/* Current Comparison */}
      {latestSession && (
        <div>
          <h3 className="text-xl font-bold mb-4">Latest Comparison</h3>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Prompt:</p>
              <p className="text-sm">{latestSession.prompt}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {latestSession.models?.map((model) => (
                <Card key={model} className="p-4">
                  <h4 className="font-bold mb-3 text-primary">{model}</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Streamdown>
                      {latestSession.responses?.[model] || "No response"}
                    </Streamdown>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {sessions && sessions.length > 1 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Comparison History</h3>
          <div className="space-y-2">
            {sessions.slice(1).map((session) => (
              <Card key={session.id} className="p-4 cursor-pointer hover:bg-muted transition-colors">
                <p className="font-medium line-clamp-1">{session.prompt}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {session.models?.join(", ")} • {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
