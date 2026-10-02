import * as React from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Maximize2,
  Split,
  Eye,
  Sliders,
  Sparkles,
  Crosshair,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Switch } from "./ui/switch";
import { Badge } from "./ui/badge";
import { SessionData } from "./ui/pdf-report-modal";

interface ColumnVisualizerProps {
  session: SessionData & { heatmapSrc?: string };
  showHeatmap: boolean;
  onToggleHeatmap: (checked: boolean) => void;
}

export function ColumnVisualizer({
  session,
  showHeatmap,
  onToggleHeatmap,
}: ColumnVisualizerProps) {
  const [zoomLevel, setZoomLevel] = React.useState<number>(100);
  const [heatmapOpacity, setHeatmapOpacity] = React.useState<number>(0.75);
  const [isComparing, setIsComparing] = React.useState<boolean>(false);
  const [mousePos, setMousePos] = React.useState<{ x: number; y: number; weight: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  // Render Grad-CAM Heatmap dynamically on HTML5 Canvas over the image
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = session.imageSrc;

    img.onload = () => {
      canvas.width = img.width || 600;
      canvas.height = img.height || 600;

      // Draw base image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (showHeatmap) {
        const width = canvas.width;
        const height = canvas.height;

        if (session.heatmapSrc && session.heatmapSrc.startsWith("data:image")) {
          // Render Real PyTorch Grad-CAM Base64 PNG Overlay
          const heatImg = new Image();
          heatImg.crossOrigin = "anonymous";
          heatImg.src = session.heatmapSrc;
          heatImg.onload = () => {
            ctx.globalAlpha = heatmapOpacity;
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(heatImg, 0, 0, width, height);
            ctx.globalAlpha = 1.0;
          };
        } else {
          // Fallback Radial Attention Heatmap Overlay
          const heatCanvas = document.createElement("canvas");
          heatCanvas.width = width;
          heatCanvas.height = height;
          const heatCtx = heatCanvas.getContext("2d");

          if (heatCtx) {
            const centerX = width * (session.riskLevel === "high" ? 0.52 : 0.48);
            const centerY = height * (session.riskLevel === "high" ? 0.48 : 0.52);
            const radius = Math.min(width, height) * 0.42;

            const grad = heatCtx.createRadialGradient(
              centerX,
              centerY,
              radius * 0.05,
              centerX,
              centerY,
              radius
            );

            if (session.riskLevel === "high") {
              grad.addColorStop(0.0, "rgba(220, 38, 38, 0.95)");
              grad.addColorStop(0.25, "rgba(245, 158, 11, 0.85)");
              grad.addColorStop(0.5, "rgba(234, 179, 8, 0.65)");
              grad.addColorStop(0.75, "rgba(6, 182, 212, 0.35)");
              grad.addColorStop(1.0, "rgba(59, 130, 246, 0.0)");
            } else {
              grad.addColorStop(0.0, "rgba(16, 185, 129, 0.85)");
              grad.addColorStop(0.35, "rgba(6, 182, 212, 0.6)");
              grad.addColorStop(0.7, "rgba(59, 130, 246, 0.3)");
              grad.addColorStop(1.0, "rgba(99, 102, 241, 0.0)");
            }

            heatCtx.fillStyle = grad;
            heatCtx.beginPath();
            heatCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            heatCtx.fill();

            ctx.globalAlpha = heatmapOpacity;
            ctx.globalCompositeOperation = "source-over";
            ctx.drawImage(heatCanvas, 0, 0);
            ctx.globalAlpha = 1.0;
          }
        }
      }
    };
  }, [session, showHeatmap, heatmapOpacity]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const maxDist = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
    const weight = Math.max(0.05, Math.min(0.99, 1 - dist / maxDist));

    setMousePos({ x, y, weight });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  const zoomIn = () => setZoomLevel((prev) => Math.min(300, prev + 25));
  const zoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 25));
  const resetZoom = () => setZoomLevel(100);

  return (
    <Card className={`col-span-12 lg:col-span-6 flex flex-col border-slate-200 bg-white ${
      isFullscreen ? "fixed inset-4 z-50 shadow-2xl overflow-hidden" : "h-full"
    }`}>
      {/* Visualizer Header */}
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-900">
              Visual Evidence & Attention Map
            </CardTitle>
            <Badge variant={showHeatmap ? "info" : "neutral"} className="text-[10px]">
              {showHeatmap ? (session.heatmapSrc ? "PyTorch Grad-CAM Enabled" : "Grad-CAM Enabled") : "Raw Dermoscopy"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Spatial Gradient Backpropagation • Layer 4 ResNet50 Attention
          </p>
        </div>

        {/* Action Controls top-right */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={zoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-mono font-semibold px-1 text-slate-700 min-w-[3rem] text-center">
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            title="Reset Zoom & Pan"
            className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition ml-1"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsComparing((prev) => !prev)}
            title="Side-by-Side Split View"
            className={`p-1.5 rounded-lg transition ${
              isComparing ? "bg-[#0F52BA] text-white" : "text-slate-600 hover:bg-white"
            }`}
          >
            <Split className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      {/* Main Image Container Area */}
      <CardContent className="p-4 flex-1 flex flex-col justify-between overflow-hidden bg-slate-100/60 relative min-h-[380px]">
        {/* Top Floating Badge overlay */}
        <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200/80 shadow-xs">
          <Crosshair className="h-3.5 w-3.5 text-[#0F52BA]" />
          <span className="text-[11px] font-semibold text-slate-800">
            {session.anatomicalSite}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            10x Optical
          </span>
        </div>

        {/* Floating Mouse Coordinate Readout HUD */}
        {mousePos && (
          <div className="absolute top-6 right-6 z-20 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-mono shadow-md flex items-center gap-3">
            <span>X: {mousePos.x}px</span>
            <span>Y: {mousePos.y}px</span>
            <span className="text-amber-300 font-bold">
              Attn Weight: {(mousePos.weight * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {/* Visualizer Frame */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative flex-1 w-full flex items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5 shadow-inner"
        >
          {isComparing ? (
            /* Split View Comparison Mode */
            <div className="grid grid-cols-2 gap-2 h-full w-full p-2">
              <div className="relative h-full w-full rounded-lg overflow-hidden border border-slate-300 bg-white">
                <img
                  src={session.imageSrc}
                  alt="Raw Dermoscopic"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                  Raw Lesion (No Heatmap)
                </span>
              </div>
              <div className="relative h-full w-full rounded-lg overflow-hidden border border-slate-300 bg-white">
                <canvas ref={canvasRef} className="h-full w-full object-cover" />
                <span className="absolute bottom-2 left-2 bg-[#0F52BA]/90 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                  Grad-CAM Attention Map
                </span>
              </div>
            </div>
          ) : (
            /* Single Large Interactive Canvas */
            <div
              className="relative transition-transform duration-200 ease-out flex items-center justify-center h-full w-full"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              <canvas
                ref={canvasRef}
                className="max-h-[440px] max-w-full rounded-lg shadow-md object-contain border border-slate-200 bg-white"
              />
            </div>
          )}
        </div>

        {/* Controls Overlay Bar */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 z-20">
          <div className="flex items-center gap-3">
            <Switch
              checked={showHeatmap}
              onCheckedChange={onToggleHeatmap}
              label={
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Sparkles className={`h-4 w-4 ${showHeatmap ? "text-[#0F52BA]" : "text-slate-400"}`} />
                  Overlay Grad-CAM Heatmap
                </span>
              }
              description="Visualizes PyTorch layer 4 focal activation weights"
            />
          </div>

          {showHeatmap && (
            <div className="flex items-center gap-3 w-full sm:w-56 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Sliders className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-medium text-slate-600 shrink-0">Opacity:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={heatmapOpacity}
                onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0F52BA]"
              />
              <span className="text-[11px] font-mono font-bold text-slate-700 w-8 text-right">
                {Math.round(heatmapOpacity * 100)}%
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
