import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Cropper, { Area } from "react-easy-crop"; // Import Area type
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useCallback, useState } from "react";
import getCroppedImg from "@/lib/crop-image-helper";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

type AvatarUploadModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AvatarUploadModal({
  open,
  onClose,
}: AvatarUploadModalProps) {
  const { updateUser } = useAuth();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropAndSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsLoading(true);
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);

      const data = new FormData();
      data.append("avatar", croppedFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/profile`,
        {
          method: "PUT",
          credentials: "include",
          body: data,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update profile");
      }

      const result = await response.json();
      updateUser(result.data);
      toast.success("Profile updated successfully!");
      onClose();
    } catch (error: unknown) {
      console.error("Profile update error:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Something went wrong");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-neutral-50 dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle>Upload & Crop Avatar</DialogTitle>
        </DialogHeader>

        {imageSrc ? (
          <div className="space-y-4">
            <div className="relative w-full h-60 bg-neutral-50 dark:bg-neutral-900 rounded-md overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={[zoom]}
              onValueChange={(v) => setZoom(v[0])}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleCropAndSave} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="border border-dashed rounded-lg p-4 text-center min-h-[300px] flex items-center justify-center">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer w-full block"
            >
              <div>
                <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Click to upload</p>
              </div>
            </label>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
