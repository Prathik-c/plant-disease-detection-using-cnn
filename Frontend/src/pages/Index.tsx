import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { DiagnosisResult } from "@/components/DiagnosisResult";
import { Button } from "@/components/ui/button";
import { Leaf, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ label: string; confidence: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleImageSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // Replace with your FastAPI backend URL
      const response = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: "✨ Analysis Complete",
        description: "Disease detection completed successfully",
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis Failed",
        description: "Unable to connect to the backend. Make sure your FastAPI server is running on localhost:8000",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background mesh */}
      <div className="fixed inset-0 bg-[image:var(--gradient-mesh)] opacity-60 pointer-events-none" />
      
      {/* Header */}
      <header className="border-b border-border/50 glass-card sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-2xl blur-xl" />
                <div className="relative rounded-2xl bg-gradient-to-br from-primary to-accent p-3 shadow-lg">
                  <Leaf className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Potato Disease Detector
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI-powered plant health diagnosis
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-10 max-w-5xl relative z-10">
        <div className="space-y-8">
          {/* Hero Info Card */}
          <div className="glass-card p-8 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 space-y-3">
                <h2 className="text-2xl font-bold">Advanced CNN Detection System</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Upload a clear image of a potato leaf and our state-of-the-art Convolutional Neural Network 
                  will analyze it to detect <span className="font-semibold text-foreground">Early Blight</span>, 
                  <span className="font-semibold text-foreground"> Late Blight</span>, or confirm if the plant is 
                  <span className="font-semibold text-foreground"> healthy</span>. Get instant confidence scores 
                  and actionable treatment recommendations.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    Real-time Analysis
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                    90%+ Accuracy
                  </span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
                    Instant Results
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <ImageUpload
              onImageSelect={handleImageSelect}
              selectedImage={imagePreview}
              onClearImage={handleClearImage}
            />
          </div>

          {/* Analyze Button */}
          {selectedFile && !result && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              size="lg"
              className="w-full h-16 text-lg font-bold shadow-lg hover:shadow-glow transition-all duration-300 animate-in fade-in scale-in delay-200"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-3 h-6 w-6" />
                  Analyze Image with CNN
                </>
              )}
            </Button>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              <DiagnosisResult label={result.label} confidence={result.confidence} />
              
              {/* New Analysis Button */}
              <Button
                onClick={handleClearImage}
                variant="outline"
                size="lg"
                className="w-full h-14 text-base font-semibold shadow-md hover:shadow-lg transition-all animate-in fade-in delay-300"
              >
                <Leaf className="mr-2 h-5 w-5" />
                Analyze Another Image
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 glass-card relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Powered by CNN Deep Learning
            </p>
            <p className="text-xs text-muted-foreground">
              Accurate Disease Detection • Real-time Analysis • Professional Results
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
