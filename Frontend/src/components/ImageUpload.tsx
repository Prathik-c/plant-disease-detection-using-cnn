import { useState, useRef, useEffect } from "react";
import { Upload, Camera, X, SwitchCamera, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  selectedImage: string | null;
  onClearImage: () => void;
}

export const ImageUpload = ({ onImageSelect, selectedImage, onClearImage }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isCapturing, setIsCapturing] = useState(false);

  // Cleanup video stream on unmount/stream change
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Always attach stream to <video> when changed and camera is on
  useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [showCamera, stream]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onImageSelect(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please ensure camera permissions are granted.");
    }
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    // Camera will be (re)started via useEffect if needed
    setTimeout(() => startCamera(), 100);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      setIsCapturing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `potato-leaf-${Date.now()}.jpg`, { type: "image/jpeg" });
            onImageSelect(file);
            stopCamera();
          }
          setIsCapturing(false);
        }, "image/jpeg", 0.95);
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  if (showCamera) {
    return (
      <Card className="glass-card p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          {/* Camera overlay grid */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/30" />
              ))}
            </div>
          </div>
          {/* Corner frames */}
          <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-lg" />
        </div>
        <div className="flex gap-3">
          <Button
            onClick={capturePhoto}
            disabled={isCapturing}
            className="flex-1 h-14 text-lg font-semibold shadow-lg hover:shadow-glow transition-all duration-300"
            size="lg"
          >
            {isCapturing ? (
              <>
                <Zap className="mr-2 h-5 w-5 animate-pulse" />
                Capturing...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-5 w-5" />
                Capture Photo
              </>
            )}
          </Button>
          <Button
            onClick={switchCamera}
            variant="secondary"
            size="lg"
            className="h-14 shadow-md"
          >
            <SwitchCamera className="h-5 w-5" />
          </Button>
          <Button
            onClick={stopCamera}
            variant="outline"
            size="lg"
            className="h-14"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    );
  }

  if (selectedImage) {
    return (
      <Card className="glass-card p-6 space-y-4 animate-in fade-in scale-in duration-500">
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img
            src={selectedImage}
            alt="Selected potato leaf"
            className="w-full h-auto rounded-2xl"
          />
          <Button
            onClick={onClearImage}
            variant="destructive"
            size="icon"
            className="absolute top-3 right-3 h-10 w-10 rounded-full shadow-lg hover:scale-110 transition-transform"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`glass-card p-10 border-2 border-dashed transition-all duration-300 hover-lift ${
        isDragging
          ? "border-primary bg-primary/10 scale-[1.02]"
          : "border-border/60 hover:border-primary/50"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-2xl" />
          <div className="relative rounded-full bg-gradient-to-br from-primary to-accent p-6 shadow-lg">
            <Upload className="h-10 w-10 text-white" />
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xl font-bold">Upload Potato Leaf Image</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Drag and drop your image here, or use the buttons below to select a file or capture with camera
          </p>
        </div>
        <div className="flex gap-4 w-full max-w-md">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex-1 h-14 text-base font-semibold shadow-md hover:shadow-lg transition-all"
            size="lg"
          >
            <Upload className="mr-2 h-5 w-5" />
            Choose File
          </Button>
          <Button
            onClick={startCamera}
            className="flex-1 h-14 text-base font-semibold shadow-lg hover:shadow-glow transition-all"
            size="lg"
          >
            <Camera className="mr-2 h-5 w-5" />
            Use Camera
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </Card>
  );
};
