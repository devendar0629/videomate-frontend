import type React from "react";
import api from "@/app/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import {
    ArrowUpRight,
    FilmIcon,
    Loader2Icon,
    RefreshCwIcon,
    ShieldCheckIcon,
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
    status: "finished" | "processing" | "failed" | string;
    visibility: "private" | "public" | string;
    createdAt: string;
    updatedAt: string;
};

const fetchMyVideos = async (): Promise<VideoItem[]> => {
    const response = await api.get<VideoItem[]>("/api/videos/all");
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

    if (resolvedPreview) {
        return (
            <img
                src={resolvedPreview}
                alt={video.title}
                className="w-full h-40 rounded-lg object-cover border border-white/10"
                loading="lazy"
            />
        );
    }

    return (
        <div className="w-full h-40 rounded-lg border border-white/10 bg-linear-to-br from-primary/20 via-slate-900 to-secondary/30 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-white/70">
                <FilmIcon className="size-4" />
                <span className="font-semibold">{video.title}</span>
            </div>
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
    const { data, isLoading, isError, refetch, isRefetching } = useQuery({
        queryKey: ["my-videos"],
        queryFn: fetchMyVideos,
    });

    const videos = data ?? [];
    const hasVideos = videos.length > 0;

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
                            <Card className="h-full border-white/10 bg-white/5 transition duration-200 hover:border-white/30 hover:shadow-lg">
                                <CardContent className="pt-6 space-y-4">
                                    <PreviewFrame video={video} />

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

                                    <div className="flex flex-wrap items-center gap-2">
                                        {video.status !== "finished" && (
                                            <StatusPill status={video.status} />
                                        )}
                                        <VisibilityPill
                                            visibility={video.visibility}
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
        </section>
    );
};

export default AllVideoDetails;
