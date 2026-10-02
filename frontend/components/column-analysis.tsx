import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity,
  ChevronDown,
  Layers,
  Cpu,
  Zap,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { Accordion, AccordionItem } from "./ui/accordion";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { SessionData } from "./ui/pdf-report-modal";

interface ColumnAnalysisProps {
  session: SessionData;
  onGenerateReport: () => void;
}

export function ColumnAnalysis({ session, onGenerateReport }: ColumnAnalysisProps) {
  const [accordionOpen, setAccordionOpen] = React.useState<boolean>(true);

  const isHighRisk = session.riskLevel === "high";
  const isModerate = session.riskLevel === "moderate";

  return (
    <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-4.5rem)] pl-0.5">
      {/* Top Card (Diagnostic Tier) */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Diagnostic Tier
            </span>
            <Badge
              variant={isHighRisk ? "danger" : isModerate ? "warning" : "success"}
            >
              {isHighRisk ? "Urgent Action" : isModerate ? "Follow-up" : "Benign"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-3">
          {/* Large bold text showing the primary prediction */}
          <div>
            <h2
              className={`text-xl font-extrabold tracking-tight ${
                isHighRisk
                  ? "text-rose-600"
                  : isModerate
                  ? "text-amber-700"
                  : "text-emerald-700"
              }`}
            >
              {session.prediction}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Target Class: {isHighRisk ? "Malignant Melanoma" : "Benign Lesion"}
            </p>
          </div>

          {/* Color-coded confidence gauge (Progress bar at 88%, using red/amber color) */}
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-600">Model Confidence</span>
              <span
                className={`font-mono text-sm font-bold ${
                  isHighRisk ? "text-rose-600" : isModerate ? "text-amber-600" : "text-emerald-600"
                }`}
              >
                {session.confidence}%
              </span>
            </div>

            {/* Progress Bar */}
            <Progress
              value={session.confidence}
              indicatorColor={
                isHighRisk ? "bg-rose-600" : isModerate ? "bg-amber-500" : "bg-emerald-500"
              }
              size="md"
            />

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0% (Benign)</span>
              <span>50% (Cutoff)</span>
              <span>100% (High Risk)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middle Card (Clinical Features: ABCD Rule) */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Clinical Features (ABCD Rule)
            </CardTitle>
            <p className="text-[10px] text-slate-400">Standard Dermatological Assessment</p>
          </div>
          <Info className="h-4 w-4 text-slate-400" />
        </CardHeader>

        <CardContent className="p-4 pt-2 space-y-3.5">
          {/* Asymmetry */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">Asymmetry (A)</span>
              <span className="font-mono text-xs font-bold text-slate-800">
                {session.abcd.asymmetry}%
              </span>
            </div>
            <Progress
              value={session.abcd.asymmetry}
              indicatorColor={session.abcd.asymmetry > 70 ? "bg-rose-500" : "bg-amber-500"}
              size="sm"
            />
            <p className="text-[10px] text-slate-400">Two non-matching halves across dual axes</p>
          </div>

          {/* Border Irregularity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">Border Irregularity (B)</span>
              <span className="font-mono text-xs font-bold text-slate-800">
                {session.abcd.border}%
              </span>
            </div>
            <Progress
              value={session.abcd.border}
              indicatorColor={session.abcd.border > 70 ? "bg-rose-500" : "bg-amber-500"}
              size="sm"
            />
            <p className="text-[10px] text-slate-400">Scalloped, notched, or blurred margins</p>
          </div>

          {/* Color Variation */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">Color Variation (C)</span>
              <span className="font-mono text-xs font-bold text-slate-800">
                {session.abcd.color}%
              </span>
            </div>
            <Progress
              value={session.abcd.color}
              indicatorColor={session.abcd.color > 70 ? "bg-rose-500" : "bg-amber-500"}
              size="sm"
            />
            <p className="text-[10px] text-slate-400">Multi-pigment: brown, black, red, tan</p>
          </div>

          {/* Diameter */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-slate-700">Diameter (D)</span>
              <span className="font-mono text-xs font-bold text-[#0F52BA]">
                {session.abcd.diameterMm} mm
              </span>
            </div>
            <Progress
              value={session.abcd.diameter}
              indicatorColor={session.abcd.diameterMm > 6.0 ? "bg-rose-500" : "bg-emerald-500"}
              size="sm"
            />
            <p className="text-[10px] text-slate-400">
              {session.abcd.diameterMm > 6.0
                ? "Exceeds >6.0mm clinical concern threshold"
                : "Within normal limits (≤6.0mm)"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Card (Model Performance - Collapsible Accordion) */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="p-4 pt-2">
          <Accordion>
            <AccordionItem
              id="model-performance"
              title="Model Performance Metrics"
              isOpen={accordionOpen}
              onToggle={() => setAccordionOpen(!accordionOpen)}
            >
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Architecture:</span>
                  <span className="font-semibold text-slate-900">
                    {session.modelMetrics.architecture}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Inference Time:</span>
                  <span className="font-semibold text-emerald-600">
                    {session.modelMetrics.inferenceTime}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Focal Loss:</span>
                  <span className="font-semibold text-slate-900">
                    {session.modelMetrics.focalLoss}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200/60 pt-1.5">
                  <span className="text-slate-500">AUC-ROC:</span>
                  <span className="font-semibold text-[#0F52BA]">
                    {session.modelMetrics.aucRoc}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                Trained on ISIC 2024 / HAM10000 dataset (25,000+ dermoscopic images).
              </p>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Bottom Action: Full-width "Generate PDF Report" button using primary medical blue color (#0F52BA) */}
      <div className="mt-auto shrink-0 pt-2">
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={onGenerateReport}
          className="gap-2.5 shadow-md hover:shadow-lg transition-all text-xs tracking-wide uppercase font-bold"
        >
          <FileText className="h-4 w-4" />
          Generate PDF Report
        </Button>
      </div>
    </div>
  );
}
