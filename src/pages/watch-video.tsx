import { useParams, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/app/api";
import VideoPlayer from "@/components/video-player";
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
    Loader2Icon,
    ThumbsDownIcon,
    ThumbsUpIcon,
    UserIcon,
} from "lucide-react";
import { AxiosError } from "axios";
import { formatRelativeTime } from "@/app/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Reaction = "like" | "dislike" | null;

type VideoData = {
    _id: string;
    title: string;
    description: string;
    uniqueFileName: string;
    previewImage: string;
    availableResolutions: string[];
    createdAt: string;
    reaction: Reaction;
    uploader: {
        avatar: string;
        name: string;
    };
};

type ReactionResponse = {
    message: string;
    updatedReaction: Reaction;
};

const fetchWatchVideo = async (videoId: string): Promise<VideoData> => {
    const response = await api.get<VideoData>(`/api/videos/${videoId}/watch`);
    return response.data;
};

const likeVideo = async (videoId: string): Promise<ReactionResponse> => {
    const response = await api.post<ReactionResponse>(
        `/api/videos/${videoId}/like`
    );
    return response.data;
};

const dislikeVideo = async (videoId: string): Promise<ReactionResponse> => {
    const response = await api.post<ReactionResponse>(
        `/api/videos/${videoId}/dislike`
    );
    return response.data;
};

const getReactionErrorMessage = (
    errorCode: string,
    action: "like" | "dislike"
): string => {
    switch (errorCode) {
        case "INVALID_VIDEO_ID":
            return "Invalid video ID";
        case "NOT_FOUND":
            return "Video not found";
        case "CANNOT_LIKE_OWN_VIDEO":
            return "You cannot like your own video";
        case "CANNOT_DISLIKE_OWN_VIDEO":
            return "You cannot dislike your own video";
        default:
            return `Failed to ${action} video`;
    }
};

const formatDate = (value: string) => {
    return new Intl.DateTimeFormat("en", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }).format(new Date(value));
};

const LoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {/* Video Player Skeleton */}
        <div className="aspect-video w-full rounded-2xl bg-white/5 border border-white/10" />

        {/* Title and Info Skeleton */}
        <div className="space-y-4">
            <div className="h-8 w-3/4 rounded-lg bg-white/10" />
            <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-white/10" />
                <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-white/10" />
                    <div className="h-3 w-24 rounded bg-white/10" />
                </div>
            </div>
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2 p-4 rounded-xl bg-white/5">
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-4 w-2/3 rounded bg-white/10" />
        </div>
    </div>
);

const ErrorState: React.FC<{ onRetry: () => void; isRetrying: boolean }> = ({
    onRetry,
    isRetrying,
}) => (
    <Card className="border-red-500/20 bg-red-500/5 max-w-2xl mx-auto">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-red-500/10">
                <FilmIcon className="size-8 text-red-400" />
            </div>
            <CardTitle className="text-red-100">Unable to load video</CardTitle>
            <CardDescription className="text-red-200/70">
                Something went wrong while fetching the video.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
            <Button onClick={onRetry} disabled={isRetrying} variant="outline">
                {isRetrying && <Loader2Icon className="size-4 animate-spin" />}
                Try Again
            </Button>
            <Button asChild variant="ghost">
                <Link to="/">Back to Home</Link>
            </Button>
        </CardContent>
    </Card>
);

const NotFoundState = () => (
    <Card className="border-amber-500/20 bg-amber-500/5 max-w-2xl mx-auto">
        <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-amber-500/10">
                <FilmIcon className="size-8 text-amber-400" />
            </div>
            <CardTitle className="text-amber-100">Video Not Found</CardTitle>
            <CardDescription className="text-amber-200/70">
                The video you're looking for doesn't exist or has been removed.
            </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
            <Button asChild variant="ghost">
                <Link to="/">Back to Home</Link>
            </Button>
        </CardContent>
    </Card>
);

export default function WatchVideo() {
    const { videoId } = useParams<{ videoId: string }>();
    const queryClient = useQueryClient();

    const {
        data: video,
        isLoading,
        isError,
        refetch,
        error,
        isRefetching,
    } = useQuery({
        queryKey: ["watch-video", videoId],
        queryFn: () => fetchWatchVideo(videoId!),
        enabled: !!videoId,
    });

    const likeMutation = useMutation({
        mutationFn: () => likeVideo(videoId!),
        onSuccess: (data) => {
            queryClient.setQueryData<VideoData>(
                ["watch-video", videoId],
                (old) =>
                    old ? { ...old, reaction: data.updatedReaction } : old
            );
        },
        onError: (error: AxiosError<{ errorCode: string }>) => {
            const errorCode = error.response?.data?.errorCode || "";
            toast.error(getReactionErrorMessage(errorCode, "like"));
        },
    });

    const dislikeMutation = useMutation({
        mutationFn: () => dislikeVideo(videoId!),
        onSuccess: (data) => {
            queryClient.setQueryData<VideoData>(
                ["watch-video", videoId],
                (old) =>
                    old ? { ...old, reaction: data.updatedReaction } : old
            );
        },
        onError: (error: AxiosError<{ errorCode: string }>) => {
            const errorCode = error.response?.data?.errorCode || "";
            toast.error(getReactionErrorMessage(errorCode, "dislike"));
        },
    });

    const handleLike = () => {
        if (!likeMutation.isPending && !dislikeMutation.isPending) {
            likeMutation.mutate();
        }
    };

    const handleDislike = () => {
        if (!likeMutation.isPending && !dislikeMutation.isPending) {
            dislikeMutation.mutate();
        }
    };

    // Check for not found error
    if (
        isError &&
        error instanceof AxiosError &&
        error.response?.data?.errorCode === "NOT_FOUND"
    ) {
        return (
            <section className="py-8">
                <NotFoundState />
            </section>
        );
    }

    if (isLoading) {
        return (
            <section className="max-w-6xl mx-auto px-4 py-6 space-y-6">
                <LoadingSkeleton />
            </section>
        );
    }

    if (isError || !video) {
        return (
            <section className="py-8">
                <ErrorState
                    onRetry={() => refetch()}
                    isRetrying={isRefetching}
                />
            </section>
        );
    }

    return (
        <section className="max-w-6xl mx-auto px-4 py-6 space-y-6">
            {/* Back Navigation */}
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors group"
            >
                <ArrowLeftIcon className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                Back to Home
            </Link>

            {/* Video Player Container */}
            <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl shadow-black/20">
                <VideoPlayer
                    options={{
                        sources: [
                            {
                                src: `${
                                    import.meta.env.VITE_BACKEND_HOST
                                }/videos/${video.uniqueFileName}/master.m3u8`,
                                type: "application/x-mpegURL",
                            },
                        ],
                        controls: true,
                        fluid: true,
                        preload: "auto",
                        poster: `${import.meta.env.VITE_BACKEND_HOST}/videos/${
                            video.uniqueFileName
                        }/thumbnail.jpg`,
                    }}
                    qualities={[
                        {
                            label: "Auto",
                            src: `${import.meta.env.VITE_BACKEND_HOST}/videos/${
                                video.uniqueFileName
                            }/master.m3u8`,
                        },
                        ...video.availableResolutions.map((resolution) => ({
                            label: resolution,
                            src: `${import.meta.env.VITE_BACKEND_HOST}/videos/${
                                video.uniqueFileName
                            }/${resolution}/index.m3u8`,
                        })),
                    ]}
                />
            </div>

            {/* Video Info Section */}
            <div className="space-y-4">
                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {video.title}
                </h1>

                {/* Uploader Info & Date */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Uploader */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {video.uploader.avatar ? (
                                <img
                                    src={`${import.meta.env.VITE_BACKEND_HOST}${
                                        video.uploader.avatar
                                    }`}
                                    alt={video.uploader.name}
                                    className="size-11 rounded-full object-cover ring-2 ring-white/10"
                                />
                            ) : (
                                <div className="size-11 rounded-full bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-white/10">
                                    <UserIcon className="size-5 text-primary" />
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-white">
                                {video.uploader.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Uploader
                            </p>
                        </div>
                    </div>

                    {/* Like/Dislike & Date */}
                    <div className="flex items-center gap-4">
                        {/* Like/Dislike Buttons */}
                        <div className="flex items-center rounded-full bg-white/5 border border-white/10 overflow-hidden">
                            <button
                                onClick={handleLike}
                                disabled={
                                    likeMutation.isPending ||
                                    dislikeMutation.isPending
                                }
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 transition-all duration-200",
                                    "hover:bg-white/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                    video.reaction === "like"
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground hover:text-white"
                                )}
                                aria-label="Like video"
                            >
                                {likeMutation.isPending ? (
                                    <Loader2Icon className="size-5 animate-spin" />
                                ) : (
                                    <ThumbsUpIcon
                                        className={cn(
                                            "size-5 transition-transform",
                                            video.reaction === "like" &&
                                                "fill-primary"
                                        )}
                                    />
                                )}
                                <span className="text-sm font-medium">
                                    Like
                                </span>
                            </button>

                            <div className="w-px h-6 bg-white/10" />

                            <button
                                onClick={handleDislike}
                                disabled={
                                    likeMutation.isPending ||
                                    dislikeMutation.isPending
                                }
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 transition-all duration-200",
                                    "hover:bg-white/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                                    video.reaction === "dislike"
                                        ? "text-red-400 bg-red-500/10"
                                        : "text-muted-foreground hover:text-white"
                                )}
                                aria-label="Dislike video"
                            >
                                {dislikeMutation.isPending ? (
                                    <Loader2Icon className="size-5 animate-spin" />
                                ) : (
                                    <ThumbsDownIcon
                                        className={cn(
                                            "size-5 transition-transform",
                                            video.reaction === "dislike" &&
                                                "fill-red-400"
                                        )}
                                    />
                                )}
                                <span className="text-sm font-medium">
                                    Dislike
                                </span>
                            </button>
                        </div>

                        {/* Upload Date */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarIcon className="size-4" />
                            <span title={formatDate(video.createdAt)}>
                                {formatRelativeTime(video.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description Card */}
            {video.description && (
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 hover:bg-white/[0.07] transition-colors">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span className="font-medium">
                            {formatDate(video.createdAt)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {video.description}
                    </p>
                </div>
            )}
        </section>
    );
}
