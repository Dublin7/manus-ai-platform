import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Play, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const AVAILABLE_TOOLS = [
  { id: "chat", name: "AI Chat", icon: "💬" },
  { id: "image", name: "Image Generator", icon: "🖼️" },
  { id: "research", name: "Research Tool", icon: "🔍" },
  { id: "code", name: "Code Assistant", icon: "💻" },
  { id: "tts", name: "Text-to-Speech", icon: "🔊" },
];

export default function WorkflowBuilder() {
  const { user } = useAuth();
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const { data: workflows } = trpc.workflow.getWorkflows.useQuery(undefined, {
    enabled: !!user,
  });

  const createMutation = trpc.workflow.create.useMutation();
  const executeMutation = trpc.workflow.execute.useMutation();

  const handleAddTool = (toolId: string) => {
    setSelectedTools((prev) => {
      if (prev.includes(toolId)) {
        return prev.filter((t) => t !== toolId);
      }
      return [...prev, toolId];
    });
  };

  const handleCreateWorkflow = async () => {
    if (!workflowName.trim() || selectedTools.length === 0) return;

    setIsCreating(true);
    try {
      await createMutation.mutateAsync({
        name: workflowName,
        description: workflowDescription,
        steps: selectedTools.map((toolId) => ({
          toolId,
          config: {},
        })),
      });
      setWorkflowName("");
      setWorkflowDescription("");
      setSelectedTools([]);
    } catch (error) {
      console.error("Failed to create workflow:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleExecuteWorkflow = async (workflowId: number) => {
    try {
      await executeMutation.mutateAsync({
        workflowId,
        input: {},
      });
    } catch (error) {
      console.error("Failed to execute workflow:", error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Workflow Builder */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Workflow Builder</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Workflow Name</label>
            <Input
              placeholder="Enter workflow name..."
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              placeholder="Describe what this workflow does..."
              value={workflowDescription}
              onChange={(e) => setWorkflowDescription(e.target.value)}
              className="w-full p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Select Tools to Chain</label>
            <div className="grid grid-cols-2 gap-3">
              {AVAILABLE_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleAddTool(tool.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedTools.includes(tool.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="text-2xl mb-2">{tool.icon}</div>
                  <div className="text-sm font-medium">{tool.name}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedTools.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Workflow Steps</label>
              <div className="space-y-2">
                {selectedTools.map((toolId, idx) => {
                  const tool = AVAILABLE_TOOLS.find((t) => t.id === toolId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tool?.icon}</span>
                        <span className="font-medium">{idx + 1}. {tool?.name}</span>
                      </div>
                      <button
                        onClick={() =>
                          setSelectedTools((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                        className="p-1 hover:bg-background rounded"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            onClick={handleCreateWorkflow}
            disabled={isCreating || !workflowName.trim() || selectedTools.length === 0}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Workflow
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Workflows List */}
      <div>
        <h3 className="text-xl font-bold mb-4">Your Workflows</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflows?.map((workflow) => (
            <Card key={workflow.id} className="p-4">
              <h4 className="font-bold mb-2">{workflow.name}</h4>
              {workflow.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {workflow.description}
                </p>
              )}

              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Steps: {workflow.steps?.length || 0}
                </p>
                <div className="space-y-1">
                  {workflow.steps?.map((step, idx) => {
                    const tool = AVAILABLE_TOOLS.find((t) => t.id === step.toolId);
                    return (
                      <div key={idx} className="text-xs text-muted-foreground">
                        {idx + 1}. {tool?.name || step.toolId}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                onClick={() => handleExecuteWorkflow(workflow.id)}
                className="w-full"
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
