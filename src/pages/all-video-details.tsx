import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import api from "@/app/api";
import { formatDuration } from "@/app/utils";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
    ArrowUpRight,
    EyeIcon,
    FilmIcon,
    Loader2Icon,
    RefreshCwIcon,
    ShieldCheckIcon,
    ThumbsDownIcon,
    ThumbsUpIcon,
} from "lucide-react";
import { Link } from "react-router";

type VideoItem = {
    _id: string;
    title: string;
    description: string;
    originalFileName: string;
    uniqueFileName: string;
    previewImage: string | null;
    availableResolutions: string[];
    duration: number;
    status: "finished" | "processing" | "failed" | string;
    visibility: "private" | "public" | string;
    createdAt: string;
    updatedAt: string;
    metrics: {
        views: number;
        likes: number;
        dislikes: number;
    };
};

const VIDEOS_PER_PAGE = 12;

const fetchMyVideos = async ({
    pageParam = 1,
}: {
    pageParam?: number;
}): Promise<VideoItem[]> => {
    const response = await api.get<VideoItem[]>("/api/videos/all", {
        params: { page: pageParam, limit: VIDEOS_PER_PAGE },
    });
    return response.data;
};

const formatDate = (value: string) => {
    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
};

const StatusPill: React.FC<{ status: VideoItem["status"] }> = ({ status }) => {
    const palette: Record<string, string> = {
        processing: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
        failed: "bg-red-500/15 text-red-200 border border-red-500/30",
    };

    return (
        <span
            className={`px-2.5 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wide ${
                palette[status] ??
                "bg-slate-500/15 text-slate-200 border border-slate-500/30"
            }`}
        >
            {status}
        </span>
    );
};

const VisibilityPill: React.FC<{ visibility: VideoItem["visibility"] }> = ({
    visibility,
}) => {
    const palette: Record<string, string> = {
        private: "bg-indigo-500/15 text-indigo-100 border border-indigo-500/30",
        public: "bg-cyan-500/15 text-cyan-100 border border-cyan-500/30",
    };

    return (
        <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.7rem] font-semibold uppercase tracking-wide ${
                palette[visibility] ??
                "bg-slate-500/15 text-slate-200 border border-slate-500/30"
            }`}
        >
            <ShieldCheckIcon className="size-3.5" />
            {visibility}
        </span>
    );
};

const PreviewFrame: React.FC<{ video: VideoItem }> = ({ video }) => {
    const resolvedPreview = `http://localhost:3000/videos/${video.uniqueFileName}/thumbnail.jpg`;

    const durationBadge = video.duration > 0 && (
        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
            {formatDuration(video.duration)}
        </span>
    );

    if (resolvedPreview) {
        return (
            <div className="relative">
                <img
                    src={resolvedPreview}
                    alt={video.title}
                    className="w-full h-40 rounded-lg object-cover border border-white/10"
                    loading="lazy"
                />
                {durationBadge}
            </div>
        );
    }

    return (
        <div className="relative w-full h-40 rounded-lg border border-white/10 bg-linear-to-br from-primary/20 via-slate-900 to-secondary/30 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-white/70">
                <FilmIcon className="size-4" />
                <span className="font-semibold">{video.title}</span>
            </div>
            {durationBadge}
        </div>
    );
};

const LoadingGrid = () => {
    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
                <div
                    key={index}
                    className="border border-white/10 rounded-xl bg-white/5 animate-pulse h-64"
                />
            ))}
        </div>
    );
};

const EmptyState = () => {
    return (
        <Card className="border-white/10 bg-white/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <FilmIcon className="size-5 text-primary" />
                    No videos yet
                </CardTitle>
                <CardDescription>
                    Upload your first video to see it listed here.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
                <Button asChild size="lg">
                    <Link to="/upload">Upload a video</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                    <Link to="/">Back to Home</Link>
                </Button>
            </CardContent>
        </Card>
    );
};

const AllVideoDetails: React.FC = function () {
    const {
        data,
        isLoading,
        isError,
        refetch,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["my-videos"],
        queryFn: fetchMyVideos,
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            // If the last page has fewer items than the limit, there are no more pages
            if (lastPage.length < VIDEOS_PER_PAGE) {
                return undefined;
            }
            return allPages.length + 1;
        },
    });

    // Flatten all pages into a single array
    const videos = data?.pages.flat() ?? [];
    const hasVideos = videos.length > 0;

    // Intersection Observer for infinite scroll
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [entry] = entries;
            if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    );

    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: "100px",
            threshold: 0,
        });

        observer.observe(element);
        return () => observer.disconnect();
    }, [handleObserver]);

    return (
        <section className="space-y-6 text-white">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">My Videos</h1>
                    <p className="text-sm text-muted-foreground">
                        All your video uploads at a glance.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="border-white/20"
                        onClick={() => refetch()}
                        disabled={isLoading || isRefetching}
                    >
                        <RefreshCwIcon
                            className={`size-4 ${
                                isRefetching || isLoading ? "animate-spin" : ""
                            }`}
                        />
                        Refresh
                    </Button>
                    <Button asChild size="lg">
                        <Link to="/upload" className="flex items-center gap-2">
                            <ArrowUpRight className="size-4" />
                            Upload New Video
                        </Link>
                    </Button>
                </div>
            </div>

            {isLoading && <LoadingGrid />}

            {isError && (
                <Card className="border-red-500/30 bg-red-500/10">
                    <CardHeader>
                        <CardTitle className="text-red-100">
                            Something went wrong
                        </CardTitle>

                        <CardDescription className="text-red-200/80">
                            We could not load your videos. Please retry.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <Button
                            onClick={() => refetch()}
                            disabled={isRefetching}
                            variant="destructive"
                        >
                            {isRefetching && (
                                <Loader2Icon className="size-4 animate-spin" />
                            )}
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!isLoading && !isError && !hasVideos && <EmptyState />}

            {!isLoading && !isError && hasVideos && (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {videos.map((video) => (
                        <Link
                            key={video._id}
                            to={`/my-videos/${video._id}`}
                            className="group"
                        >
                            <Card className="h-full border-white/10 bg-white/5 transition duration-200 hover:border-white/30 hover:shadow-lg py-5">
                                <CardContent className="space-y-4 px-5">
                                    <PreviewFrame video={video} />

                                    {/* Title and Description */}
                                    <div className="space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-base line-clamp-2">
                                                {video.title}
                                            </CardTitle>

                                            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-white" />
                                        </div>

                                        {video.description && (
                                            <CardDescription className="line-clamp-2 text-sm">
                                                {video.description}
                                            </CardDescription>
                                        )}
                                    </div>

                                    {/* Visibility */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {video.status !== "finished" && (
                                            <StatusPill status={video.status} />
                                        )}
                                        <VisibilityPill
                                            visibility={video.visibility}
                                        />
                                    </div>

                                    {/* Metrics */}
                                    <div className="flex w-fit items-center gap-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-1.5">
                                            <EyeIcon className="size-3.5 text-blue-400" />
                                            <span className="text-xs font-medium">
                                                {video.metrics.views.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="h-4 w-px bg-white/10" />

                                        <div className="flex items-center gap-1.5">
                                            <ThumbsUpIcon className="size-3.5 text-green-400" />
                                            <span className="text-xs font-medium">
                                                {video.metrics.likes.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="h-4 w-px bg-white/10" />

                                        <div className="flex items-center gap-1.5">
                                            <ThumbsDownIcon className="size-3.5 text-red-400" />
                                            <span className="text-xs font-medium">
                                                {video.metrics.dislikes.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="flex flex-col justify-center gap-2.5 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1.5">
                                            {/* Award star icon */}
                                            <svg
                                                className="size-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                height="24px"
                                                viewBox="0 -960 960 960"
                                                width="24px"
                                                fill="#e3e3e3"
                                            >
                                                <path d="m363-310 117-71 117 71-31-133 104-90-137-11-53-126-53 126-137 11 104 90-31 133ZM480-28 346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-112 100-100h140v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h140l100 100Zm0-340Z" />
                                            </svg>

                                            {video.availableResolutions.join(
                                                " • "
                                            ) || "No renditions"}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <ShieldCheckIcon className="size-3.5" />
                                            {formatDate(video.createdAt)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}

            {/* Infinite scroll trigger element */}
            {hasVideos && (
                <div ref={loadMoreRef} className="flex justify-center py-6">
                    {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2Icon className="size-5 animate-spin" />
                            <span className="text-sm">
                                Loading more videos...
                            </span>
                        </div>
                    )}
                    {!hasNextPage && videos.length > VIDEOS_PER_PAGE && (
                        <p className="text-sm text-muted-foreground">
                            You've reached the end
                        </p>
                    )}
                </div>
            )}
        </section>
    );
};

export default AllVideoDetails;
