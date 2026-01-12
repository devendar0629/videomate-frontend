import { useCallback, useRef, useState } from "react";

type UploadVideoDialogProps = {
    onFileSelect?: (file: File | null) => void;
    disabled?: boolean;
};

const UploadDialog: React.FC<UploadVideoDialogProps> = ({
    onFileSelect,
    disabled = false,
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [drag, setDrag] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    const humanReadableSize = (file: File) => {
        return `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleFile = useCallback(
        (file?: File) => {
            if (!file || !file.type.startsWith("video/")) return;

            if (inputRef.current) {
                inputRef.current.value = "";
            }

            setFile(file);
            onFileSelect?.(file);
        },
        [onFileSelect]
    );

    return (
        <div className="max-w-3xl gap-6">
            <input
                ref={inputRef}
                className="hidden"
                type="file"
                accept="video/*"
                id="upload-video"
                disabled={disabled}
                onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <label
                className={`w-full h-52 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors px-16 text-center text-base text-muted-foreground ${
                    drag
                        ? "border-primary/70 bg-primary/5"
                        : "border-gray-400 hover:border-primary/50 hover:bg-primary/5"
                }`}
                htmlFor="upload-video"
                onDragOver={(e) => {
                    if (disabled) return;

                    e.preventDefault();
                    setDrag(true);
                }}
                onDragLeave={() => {
                    if (disabled) return;

                    setDrag(false);
                }}
                onDrop={(e) => {
                    if (disabled) return;

                    e.preventDefault();

                    setDrag(false);
                    handleFile(e.dataTransfer?.files?.[0]);
                }}
            >
                {file ? (
                    <span className="text-sm">
                        {file.name} • {humanReadableSize(file)}
                    </span>
                ) : (
                    "Drag and drop a video file here, or click to select a file"
                )}
            </label>
        </div>
    );
};

export default UploadDialog;
export type { UploadVideoDialogProps };
