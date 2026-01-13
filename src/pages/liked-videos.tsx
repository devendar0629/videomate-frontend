import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Heart, Loader2, VideoOff, Clock } from "lucide-react";
import api from "@/app/api";
import { formatDuration, formatRelativeTime } from "@/app/utils";

interface LikedVideoItem {
    video: {
        _id: string;
        title: string;
        description: string;
        uniqueFileName: string;
        uploader: {
            avatar: string;
            name: string;
        };
        duration: number;
    };
    likedAt: string;
}

const VIDEOS_PER_PAGE = 12;

const VideoCard: React.FC<{ item: LikedVideoItem }> = ({ item }) => {
    const { video, likedAt } = item;
    const thumbnailUrl = `${import.meta.env.VITE_BACKEND_HOST}/videos/${
        video.uniqueFileName
    }/thumbnail.jpg`;
    const uploaderAvatarUrl = `${import.meta.env.VITE_BACKEND_HOST}${
        video.uploader.avatar
    }`;

    return (
        <Link
            to={`/videos/watch/${video._id}`}
            className="group flex flex-col sm:flex-row gap-4 p-3 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
        >
            {/* Thumbnail */}
            <div className="relative w-full sm:w-48 md:w-56 aspect-video shrink-0 rounded-lg overflow-hidden bg-muted">
                <img
                    src={thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {video.duration > 0 && (
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 text-white text-xs font-medium rounded">
                        {formatDuration(video.duration)}
                    </span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </div>

            {/* Content */}
            <div className="flex flex-col flex-1 min-w-0 gap-2">
                <h3 className="font-semibold text-base md:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {video.title}
                </h3>

                <div className="flex items-center gap-2">
                    <img
                        src={uploaderAvatarUrl}
                        alt={video.uploader.name}
                        className="size-6 rounded-full object-cover border border-border"
                    />
                    <span className="text-sm text-muted-foreground">
                        {video.uploader.name}
                    </span>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 hidden md:block">
                    {video.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
                    <Clock className="size-3.5" />
                    <span>Liked {formatRelativeTime(likedAt)}</span>
                </div>
            </div>
        </Link>
    );
};

const LikedVideos: React.FC = function () {
    const loadMoreRef = useRef<HTMLDivElement>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        isError,
        refetch,
    } = useInfiniteQuery({
        queryKey: ["videos", "liked"],
        queryFn: async ({ pageParam = 1 }) => {
            const response = await api.get<LikedVideoItem[]>(
                "/api/videos/liked",
                {
                    params: { page: pageParam, limit: VIDEOS_PER_PAGE },
                }
            );
            return response.data;
        },
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < VIDEOS_PER_PAGE) {
                return undefined;
            }
            return allPages.length + 1;
        },
        initialPageParam: 1,
    });

    const allVideos = data?.pages.flatMap((page) => page) ?? [];

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasNextPage &&
                    !isFetching &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => {
            if (loadMoreRef.current) {
                observer.unobserve(loadMoreRef.current);
            }
        };
    }, [hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

    return (
        <div className="flex flex-col w-full h-full p-6 gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-12 rounded-xl bg-linear-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30">
                    <Heart className="size-6 text-rose-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Liked Videos</h1>
                    <p className="text-sm text-muted-foreground">
                        {allVideos.length > 0
                            ? `${allVideos.length} video${
                                  allVideos.length !== 1 ? "s" : ""
                              } you've liked`
                            : "Videos you've liked will appear here"}
                    </p>
                </div>
            </div>

            {/* Loading State - Initial */}
            {isFetching && !isFetchingNextPage && allVideos.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                        Loading liked videos...
                    </p>
                </div>
            )}

            {/* Error State */}
            {isError && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
                        <VideoOff className="size-8 text-destructive" />
                    </div>
                    <p className="text-muted-foreground">
                        Failed to load liked videos
                    </p>
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isFetching && !isError && allVideos.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="size-20 rounded-full bg-linear-to-br from-rose-500/10 to-pink-500/10 flex items-center justify-center">
                        <Heart className="size-10 text-rose-500/50" />
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-1">
                            No liked videos yet
                        </h2>
                        <p className="text-muted-foreground text-sm max-w-md">
                            Start exploring and like videos to see them here.
                            Your liked videos will be saved for easy access.
                        </p>
                    </div>
                    <Link
                        to="/"
                        className="mt-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        Explore Videos
                    </Link>
                </div>
            )}

            {/* Video List */}
            {allVideos.length > 0 && (
                <div className="flex flex-col gap-3">
                    {allVideos.map((item) => (
                        <VideoCard key={item.video._id} item={item} />
                    ))}
                </div>
            )}

            {/* Load More Trigger / Loading More */}
            {hasNextPage && (
                <div
                    ref={loadMoreRef}
                    className="flex items-center justify-center py-6"
                >
                    {isFetchingNextPage && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="size-5 animate-spin" />
                            <span className="text-sm">Loading more...</span>
                        </div>
                    )}
                </div>
            )}

            {/* End of List */}
            {!hasNextPage && allVideos.length > 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                    You've reached the end
                </p>
            )}
        </div>
    );
};

export default LikedVideos;
