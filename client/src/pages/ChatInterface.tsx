import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Plus, Trash2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ChatInterface() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: conversations } = trpc.chat.getConversations.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: currentChat } = trpc.chat.getConversation.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId }
  );

  const createConversationMutation = trpc.chat.createConversation.useMutation();
  const sendMessageMutation = trpc.chat.sendMessage.useMutation();

  const handleNewChat = async () => {
    const result = await createConversationMutation.mutateAsync({
      title: "New Conversation",
      model: "gpt-4",
    });
    setSelectedConversationId(result?.id || null);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversationId) return;

    setIsLoading(true);
    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversationId,
        message: messageInput,
      });
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-background p-4 flex flex-col">
        <Button
          onClick={handleNewChat}
          className="w-full mb-4"
          variant="default"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations?.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversationId(conv.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedConversationId === conv.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <div className="truncate font-medium">{conv.title || "Untitled"}</div>
              <div className="text-xs opacity-70">{conv.model}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId && currentChat ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentChat.messages?.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <Card
                    className={`max-w-md p-4 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </Card>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <Card className="bg-muted p-4">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </Card>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-border p-4 space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !messageInput.trim()}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Start a Conversation</h2>
              <p>Create a new chat to begin talking with AI</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
