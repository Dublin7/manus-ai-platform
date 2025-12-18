import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import ChatInterface from "./pages/ChatInterface";
import ImageGenerator from "./pages/ImageGenerator";
import MultiBotArena from "./pages/MultiBotArena";
import TextToSpeech from "./pages/TextToSpeech";
import VideoCreator from "./pages/VideoCreator";
import ResearchTool from "./pages/ResearchTool";
import CodeAssistant from "./pages/CodeAssistant";
import WorkflowBuilder from "./pages/WorkflowBuilder";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/chat"}>
        {() => (
          <DashboardLayout>
            <ChatInterface />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/image"}>
        {() => (
          <DashboardLayout>
            <ImageGenerator />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/multi-bot"}>
        {() => (
          <DashboardLayout>
            <MultiBotArena />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/tts"}>
        {() => (
          <DashboardLayout>
            <TextToSpeech />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/video"}>
        {() => (
          <DashboardLayout>
            <VideoCreator />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/research"}>
        {() => (
          <DashboardLayout>
            <ResearchTool />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/code"}>
        {() => (
          <DashboardLayout>
            <CodeAssistant />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/workflow"}>
        {() => (
          <DashboardLayout>
            <WorkflowBuilder />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
