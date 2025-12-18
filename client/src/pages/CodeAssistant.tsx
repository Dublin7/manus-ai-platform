import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Zap } from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "cpp",
  "csharp",
  "go",
  "rust",
  "sql",
];

export default function CodeAssistant() {
  const { user } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: sessions } = trpc.code.getSessions.useQuery(undefined, {
    enabled: !!user,
  });

  const createSessionMutation = trpc.code.createSession.useMutation();
  const getAssistanceMutation = trpc.code.getAssistance.useMutation();

  const handleCreateSession = async () => {
    if (!sessionTitle.trim()) return;

    const result = await createSessionMutation.mutateAsync({
      title: sessionTitle,
      language,
    });
    setSelectedSessionId(result?.id || null);
    setSessionTitle("");
    setCode("");
  };

  const handleGetAssistance = async () => {
    if (!code.trim() || !selectedSessionId) return;

    setIsLoading(true);
    try {
      await getAssistanceMutation.mutateAsync({
        sessionId: selectedSessionId,
        code,
      });
    } catch (error) {
      console.error("Failed to get assistance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentSession = sessions?.find((s) => s.id === selectedSessionId);

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-background p-4 flex flex-col">
        <div className="space-y-3 mb-4">
          <Input
            placeholder="Session title..."
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            className="text-sm"
          />
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleCreateSession}
            className="w-full"
            variant="default"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Session
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {sessions?.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelectedSessionId(session.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                selectedSessionId === session.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <div className="truncate font-medium">{session.title}</div>
              <div className="text-xs opacity-70">{session.language}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            <div className="flex-1 flex gap-4 p-4 overflow-hidden">
              {/* Code Editor */}
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-medium mb-2">Code</label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your code here..."
                  className="flex-1 p-3 border border-input rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* Suggestions */}
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-medium mb-2">Suggestions</label>
                <div className="flex-1 border border-input rounded-lg p-3 overflow-y-auto bg-muted/50">
                  {currentSession.suggestions ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Streamdown>{currentSession.suggestions}</Streamdown>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Get code suggestions by clicking the button below
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="border-t border-border p-4">
              <Button
                onClick={handleGetAssistance}
                disabled={isLoading || !code.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Get Suggestions
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Create a Session</h2>
              <p>Start a new code assistance session to get AI-powered suggestions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
