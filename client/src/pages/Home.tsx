import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import {
  MessageCircle,
  Image,
  Zap,
  Volume2,
  Film,
  Search,
  Code2,
  Workflow,
} from "lucide-react";

const FEATURES = [
  {
    id: "chat",
    name: "AI Chat Interface",
    description: "Chat with multiple LLM models with streaming responses and markdown rendering",
    icon: MessageCircle,
    path: "/chat",
  },
  {
    id: "image",
    name: "Image Generator",
    description: "Generate stunning images using FLUX, Imagen, or GPT-Image-1",
    icon: Image,
    path: "/image",
  },
  {
    id: "multi-bot",
    name: "Multi-Bot Arena",
    description: "Compare responses from different AI models side-by-side",
    icon: Zap,
    path: "/multi-bot",
  },
  {
    id: "tts",
    name: "Text-to-Speech",
    description: "Convert text to natural-sounding speech with ElevenLabs",
    icon: Volume2,
    path: "/tts",
  },
  {
    id: "video",
    name: "Video Creator",
    description: "Generate videos with Sora or Veo from text descriptions",
    icon: Film,
    path: "/video",
  },
  {
    id: "research",
    name: "Research Tool",
    description: "Deep research with comprehensive findings and sources",
    icon: Search,
    path: "/research",
  },
  {
    id: "code",
    name: "Code Assistant",
    description: "Get AI-powered code suggestions and improvements",
    icon: Code2,
    path: "/code",
  },
  {
    id: "workflow",
    name: "Workflow Builder",
    description: "Chain multiple AI tools together for complex tasks",
    icon: Workflow,
    path: "/workflow",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Manus AI Platform</h1>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.name || "User"}
                </span>
                <Button variant="outline" size="sm">
                  Settings
                </Button>
              </div>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Your All-in-One AI Toolkit
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access multiple AI models and tools in one unified platform. Generate images, chat with LLMs, create videos, and build complex workflows.
          </p>
        </div>

        {isAuthenticated ? (
          <>
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={feature.id}
                    className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => navigate(feature.path)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">
                      {feature.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </Card>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">8</div>
                <p className="text-muted-foreground">AI Tools Available</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">10+</div>
                <p className="text-muted-foreground">AI Models Supported</p>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">∞</div>
                <p className="text-muted-foreground">Possible Workflows</p>
              </Card>
            </div>

            {/* CTA */}
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Ready to explore? Click on any tool above to get started.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <Card className="max-w-md mx-auto p-8">
              <h3 className="text-2xl font-bold mb-4">Get Started</h3>
              <p className="text-muted-foreground mb-6">
                Sign in to access all AI tools and features
              </p>
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="w-full"
                size="lg"
              >
                Sign In with Manus
              </Button>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-muted-foreground">
          <p>Manus AI Platform © 2025. Powered by advanced AI models.</p>
        </div>
      </footer>
    </div>
  );
}
