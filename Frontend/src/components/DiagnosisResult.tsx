import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Info, AlertTriangle, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DiagnosisResultProps {
  label: string;
  confidence: number;
}

// Fixed diseaseInfo mapping to match backend output
const diseaseInfo: Record<
  string,
  { description: string; treatment: string; severity: "healthy" | "warning" | "danger" }
> = {
  "healthy": {
    description:
      "The potato plant appears healthy with no visible signs of disease. The leaf shows normal coloration and structure.",
    treatment:
      "Continue regular care and monitoring. Maintain proper watering schedule, ensure adequate nutrition, and inspect regularly for early signs of disease.",
    severity: "healthy",
  },
  "early_blight": {
    description:
      "Early blight is caused by the fungus Alternaria solani. It typically affects older leaves first, causing dark spots with concentric rings (target-like pattern).",
    treatment:
      "Apply appropriate fungicides immediately. Remove and destroy infected leaves. Improve air circulation around plants. Practice crop rotation and avoid overhead watering. Monitor closely for spread.",
    severity: "warning",
  },
  "late_blight": {
    description:
      "Late blight is caused by Phytophthora infestans and can rapidly destroy entire crops within days. This is the same disease that caused the Irish Potato Famine.",
    treatment:
      "URGENT: Apply fungicides immediately. Remove and destroy all infected plants. This disease spreads rapidly in cool, wet conditions. Consider emergency harvest of unaffected tubers. Implement strict quarantine measures.",
    severity: "danger",
  },
  "no_leaf": {
  description: "No potato leaf was detected in the image. Please ensure a potato leaf fills the majority of the picture area, with clear focus and lighting.",
  treatment: "Try capturing a clear, close-up image of only the leaf, with minimal background and good lighting.",
  severity: "danger"
},

};

export const DiagnosisResult = ({ label, confidence }: DiagnosisResultProps) => {
  const info = diseaseInfo[label] || diseaseInfo["healthy"];
  const displayLabel = label.replace(/_/g, " ");
  const confidencePercent = Math.round(confidence * 100);

  const getIcon = () => {
    switch (info.severity) {
      case "healthy":
        return <CheckCircle className="h-7 w-7 text-healthy" />;
      case "warning":
        return <AlertTriangle className="h-7 w-7 text-warning" />;
      case "danger":
        return <AlertCircle className="h-7 w-7 text-destructive" />;
    }
  };

  const getSeverityColor = () => {
    switch (info.severity) {
      case "healthy":
        return "bg-healthy hover:bg-healthy/90";
      case "warning":
        return "bg-warning hover:bg-warning/90";
      case "danger":
        return "bg-destructive hover:bg-destructive/90";
    }
  };

  const getSeverityLabel = () => {
    switch (info.severity) {
      case "healthy":
        return "Healthy Plant";
      case "warning":
        return "Moderate Risk";
      case "danger":
        return "Critical Alert";
    }
  };

  const getConfidenceColor = () => {
    if (confidencePercent >= 80) return "text-healthy";
    if (confidencePercent >= 60) return "text-warning";
    return "text-destructive";
  };

  return (
    <Card className="glass-card p-8 space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 shadow-lg hover:shadow-xl transition-all">
      {/* Header with sparkle effect */}
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider">
          Diagnosis Complete
        </h3>
      </div>

      {/* Main diagnosis section */}
      <div className="flex items-start gap-5">
        <div className="mt-1 p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 shadow-inner">
          {getIcon()}
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h3 className="text-3xl font-bold gradient-text">{displayLabel}</h3>
            <Badge className={`${getSeverityColor()} text-white px-4 py-1.5 text-sm font-semibold shadow-md`}>
              {getSeverityLabel()}
            </Badge>
          </div>

          {/* Confidence Score */}
          <div className="space-y-3 bg-muted/30 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Confidence Score
              </span>
              <span className={`text-xl font-bold ${getConfidenceColor()}`}>
                {confidencePercent}%
              </span>
            </div>
            <Progress value={confidencePercent} className="h-3 shadow-inner" />
            {confidencePercent >= 90 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-healthy" />
                Very high confidence in diagnosis
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Information sections */}
      <div className="space-y-5 pt-4">
        <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-card to-muted/20 shadow-sm border border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <h4 className="font-bold text-base">About This Condition</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-11">
            {info.description}
          </p>
        </div>

        <div className="space-y-3 p-5 rounded-xl bg-gradient-to-br from-card to-muted/20 shadow-sm border border-border/50">
          <div className={`flex items-center gap-2.5`}>
            <div
              className={`p-2 rounded-lg ${
                info.severity === "danger"
                  ? "bg-destructive/10"
                  : info.severity === "warning"
                  ? "bg-warning/10"
                  : "bg-healthy/10"
              }`}
            >
              <AlertCircle
                className={`h-4 w-4 ${
                  info.severity === "danger"
                    ? "text-destructive"
                    : info.severity === "warning"
                    ? "text-warning"
                    : "text-healthy"
                }`}
              />
            </div>
            <h4 className="font-bold text-base">Recommended Action</h4>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-11">
            {info.treatment}
          </p>
        </div>
      </div>
    </Card>
  );
};
