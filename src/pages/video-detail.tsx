import type React from "react";
import { useParams, Link } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import api from "@/app/api";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ArrowLeftIcon,
    CalendarIcon,
    FilmIcon,
    GlobeIcon,
    Loader2Icon,
    LockIcon,
    RefreshCwIcon,
    Trash2Icon,
} from "lucide-react";
import VideoPlayer from "@/components/video-player";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from "@/components/ui/dialog";
import { AxiosError } from "axios";
import { toast } from "sonner";

type VideoItem = {
    _id: string;
    title: string;
    description: string;
    uniqueFileName: string;
    originalFileName: string;
    previewImage: string | null;
    availableResolutions: string[];
    status: "finished" | "processing" | "failed" | string;
    visibility: "private" | "public" | string;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string;
};

const fetchVideoById = async (videoId: string): Promise<VideoItem> => {
    const response = await api.get<VideoItem>(`/api/videos/${videoId}`);
    return response.data;
};

const formatDate = (value: string) => {
    return new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
};

const VisibilityBadge: React.FC<{ visibility: VideoItem["visibility"] }> = ({
    visibility,
}) => {
    const isPrivate = visibility === "private";

    return (
        <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                isPrivate
                    ? "bg-indigo-500/10 border-indigo-500/20"
                    : "bg-cyan-500/10 border-cyan-500/20"
            }`}
        >
            {isPrivate ? (
                <LockIcon className="size-3.5 text-indigo-300" />
            ) : (
                <GlobeIcon className="size-3.5 text-cyan-300" />
            )}
            <span
                className={`text-xs font-medium uppercase tracking-wide ${
                    isPrivate ? "text-indigo-300" : "text-cyan-300"
                }`}
            >
                {visibility}
            </span>
        </div>
    );
};

const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-white/10" />
            <div className="h-8 w-64 rounded-lg bg-white/10" />
        </div>
        <div className="aspect-video w-full rounded-xl bg-white/5 border border-white/10" />
        <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
                <div className="h-6 w-3/4 rounded bg-white/10" />
                <div className="h-20 w-full rounded bg-white/10" />
            </div>
            <div className="h-48 rounded-xl bg-white/10" />
        </div>
    </div>
);

const ErrorState: React.FC<{ onRetry: () => void; isRetrying: boolean }> = ({
    onRetry,
    isRetrying,
}) => (
    <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-500/10">
                <FilmIcon className="size-8 text-red-400" />
            </div>
            <CardTitle className="text-red-100">Unable to load video</CardTitle>
            <CardDescription className="text-red-200/70">
                Something went wrong while fetching the video details.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
            <Button onClick={onRetry} disabled={isRetrying} variant="outline">
                {isRetrying && <Loader2Icon className="size-4 animate-spin" />}
                Try Again
            </Button>
            <Button asChild variant="ghost">
                <Link to="/my-videos">Back to My Videos</Link>
            </Button>
        </CardContent>
    </Card>
);

const ProcessingState: React.FC<{
    video: VideoItem;
    onRefresh: () => void;
    isRefreshing: boolean;
}> = ({ video, onRefresh, isRefreshing }) => (
    <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-500/10">
                <Loader2Icon className="size-8 text-amber-400 animate-spin" />
            </div>
            <CardTitle className="text-amber-100">{video.title}</CardTitle>
            <CardDescription className="text-amber-200/70">
                Your video is being processed. This may take a few minutes
                depending on the file size.
            </CardDescription>
        </CardHeader>

        <CardContent className="flex justify-center">
            <Button
                onClick={onRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="border-amber-500/30"
            >
                {isRefreshing ? (
                    <Loader2Icon className="size-4 animate-spin" />
                ) : (
                    <RefreshCwIcon className="size-4" />
                )}
                Check Status
            </Button>
        </CardContent>
    </Card>
);

const FailedState: React.FC<{ video: VideoItem }> = ({ video }) => (
    <Card className="border-red-500/20 bg-red-500/5">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-500/10">
                <FilmIcon className="size-8 text-red-400" />
            </div>
            <CardTitle className="text-red-100">{video.title}</CardTitle>
            <CardDescription className="text-red-200/70">
                {video.errorMessage ||
                    "Video processing failed. Please try uploading again."}
            </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
            <Button asChild>
                <Link to="/upload">Upload Again</Link>
            </Button>
        </CardContent>
    </Card>
);

const VideoDeleteButton: React.FC<{ videoId: string }> = ({ videoId }) => {
    const { mutateAsync: deleteVideo, isPending: isDeleting } = useMutation({
        mutationFn: async () => {
            return api.delete(`/api/videos/${videoId}`);
        },
    });

    const handleDelete = async () => {
        try {
            const response = await deleteVideo();

            if (response.status !== 204) {
                throw new Error();
            }
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                const errorCode = err.response.data.errorCode;

                if (errorCode === "INVALID_VIDEO_ID") {
                    toast.error("Invalid video ID.");
                } else if (errorCode === "VIDEO_NOT_FOUND") {
                    toast.error("Video not found.");
                } else {
                    toast.error(
                        "An unexpected error occurred. Please try again."
                    );
                }
            } else {
                toast.error("An unexpected error occurred. Please try again.");
            }
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    disabled={isDeleting}
                    type="button"
                    variant="destructive"
                    className="w-max mt-2 rounded-sm"
                >
                    <Trash2Icon className="mb-0.75" />
                    Delete Video
                </Button>
            </DialogTrigger>

            <DialogContent className="font-[Google_Sans_Flex]">
                <DialogTitle>Delete Video</DialogTitle>

                <DialogDescription>
                    Are you sure you want to delete this video? This action
                    cannot be undone.
                </DialogDescription>

                <DialogFooter>
                    <Button
                        onClick={handleDelete}
                        variant="destructive"
                        disabled={isDeleting}
                    >
                        Confirm Delete
                    </Button>

                    <DialogClose asChild>
                        <Button disabled={isDeleting} variant="outline">
                            Cancel
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function VideoDetails() {
    const { videoId } = useParams<{ videoId: string }>();

    const {
        data: video,
        isLoading,
        isError,
        refetch,
        error,
        isRefetching,
    } = useQuery({
        queryKey: ["video", videoId],
        queryFn: () => fetchVideoById(videoId!),
        enabled: !!videoId,
    });

    if (
        isError &&
        error instanceof AxiosError &&
        error.response?.data?.errorCode === "VIDEO_NOT_FOUND"
    ) {
        return (
            <section className="max-w-2xl mx-auto py-12">
                <Card className="border-red-500/20 bg-red-500/5">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-500/10">
                            <FilmIcon className="size-8 text-red-400" />
                        </div>
                        <CardTitle className="text-red-100">
                            Video Not Found
                        </CardTitle>
                        <CardDescription className="text-red-200/70">
                            The video you are looking for does not exist.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center gap-3">
                        <Button asChild variant="ghost">
                            <Link to="/my-videos">Back to My Videos</Link>
                        </Button>
                    </CardContent>
                </Card>
            </section>
        );
    }

    if (isLoading) {
        return (
            <section className="space-y-6 text-white">
                <LoadingSkeleton />
            </section>
        );
    }

    if (isError || !video) {
        return (
            <section className="max-w-2xl mx-auto py-12">
                <ErrorState
                    onRetry={() => refetch()}
                    isRetrying={isRefetching}
                />
            </section>
        );
    }

    if (video.status === "waiting") {
        return (
            <section className="space-y-6 text-white">
                <Link
                    to="/my-videos"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="size-4" />
                    Back to My Videos
                </Link>
                <ProcessingState
                    video={video}
                    onRefresh={() => refetch()}
                    isRefreshing={isRefetching}
                />
            </section>
        );
    }

    if (video.status === "processing") {
        return (
            <section className="space-y-6 text-white">
                <Link
                    to="/my-videos"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="size-4" />
                    Back to My Videos
                </Link>
                <ProcessingState
                    video={video}
                    onRefresh={() => refetch()}
                    isRefreshing={isRefetching}
                />
            </section>
        );
    }

    if (video.status === "failed") {
        return (
            <section className="space-y-6 text-white">
                <Link
                    to="/my-videos"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="size-4" />
                    Back to My Videos
                </Link>
                <FailedState video={video} />
            </section>
        );
    }

    return (
        <section className="space-y-6 text-white">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Link
                    to="/my-videos"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
                >
                    <ArrowLeftIcon className="size-4" />
                    Back to My Videos
                </Link>

                <div className="flex items-center gap-2">
                    <VisibilityBadge visibility={video.visibility} />
                </div>
            </div>

            {/* Content Grid */}
            <div>
                {/* Main Info */}
                <div className="space-y-4 w-full">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight">
                            {video.title}
                        </h1>
                        {video.description && (
                            <p className="mt-2 text-muted-foreground leading-relaxed">
                                {video.description}
                            </p>
                        )}
                    </div>

                    <div className="max-w-4xl rounded-sm overflow-hidden">
                        <VideoPlayer
                            options={{
                                sources: [
                                    {
                                        src: `${
                                            import.meta.env.VITE_BACKEND_HOST
                                        }/videos/${
                                            video.uniqueFileName
                                        }/master.m3u8`,
                                        type: "application/x-mpegURL",
                                    },
                                ],
                                controls: true,
                                fluid: true,
                                preload: "auto",
                                poster: `${
                                    import.meta.env.VITE_BACKEND_HOST
                                }/videos/${video.uniqueFileName}/thumbnail.jpg`,
                            }}
                            qualities={[
                                {
                                    label: "Auto",
                                    src: `${
                                        import.meta.env.VITE_BACKEND_HOST
                                    }/videos/${
                                        video.uniqueFileName
                                    }/master.m3u8`,
                                },
                                ...video.availableResolutions.map(
                                    (resolution) => ({
                                        label: resolution,
                                        src: `${
                                            import.meta.env.VITE_BACKEND_HOST
                                        }/videos/${
                                            video.uniqueFileName
                                        }/${resolution}/index.m3u8`,
                                    })
                                ),
                            ]}
                        />
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-4" />
                            <span>Uploaded {formatDate(video.createdAt)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <FilmIcon className="size-4" />
                            <span>{video.originalFileName}</span>
                        </div>

                        <VideoDeleteButton videoId={video._id} />
                    </div>
                </div>
            </div>
        </section>
    );
}
