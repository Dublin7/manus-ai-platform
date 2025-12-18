import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Search, Copy } from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ResearchTool() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: sessions } = trpc.research.getSessions.useQuery(undefined, {
    enabled: !!user,
  });

  const searchMutation = trpc.research.search.useMutation();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      await searchMutation.mutateAsync({
        query,
      });
      setQuery("");
    } catch (error) {
      console.error("Failed to perform research:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const latestSession = sessions?.[0];

  return (
    <div className="space-y-6 p-6">
      {/* Search Form */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Research Tool</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Research Query</label>
            <Input
              placeholder="Enter your research topic or question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
              disabled={isSearching}
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="w-full"
            size="lg"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Researching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Start Research
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Latest Research */}
      {latestSession && (
        <div>
          <h3 className="text-xl font-bold mb-4">Latest Research</h3>
          <Card className="p-6">
            <div className="mb-4">
              <h4 className="font-bold text-lg mb-2">{latestSession.query}</h4>
              <p className="text-xs text-muted-foreground">
                {new Date(latestSession.createdAt).toLocaleDateString()}
              </p>
            </div>

            {latestSession.findings && (
              <div className="space-y-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Streamdown>{latestSession.findings}</Streamdown>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(latestSession.findings || "", latestSession.id)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedId === latestSession.id ? "Copied!" : "Copy Findings"}
                </Button>
              </div>
            )}

            {latestSession.status === "pending" && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {latestSession.status === "failed" && (
              <div className="text-center py-8 text-muted-foreground">
                <p>Research failed. Please try again.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* History */}
      {sessions && sessions.length > 1 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Research History</h3>
          <div className="space-y-2">
            {sessions.slice(1).map((session) => (
              <Card key={session.id} className="p-4 cursor-pointer hover:bg-muted transition-colors">
                <p className="font-medium line-clamp-1">{session.query}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(session.createdAt).toLocaleDateString()} • {session.status}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
