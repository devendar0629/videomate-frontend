import { SearchIcon, UploadIcon, Loader2, VideoOff } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Link } from "react-router";
import { useRef, useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/app/api";
import { formatRelativeTime } from "@/app/utils";

interface VideoResult {
    _id: string;
    title: string;
    description: string;
    uniqueFileName: string;
    availableResolutions: string[];
    createdAt: string;
    uploader: {
        avatar: string;
        name: string;
    };
    metrics: {
        views: number;
        likes: number;
        dislikes: number;
    };
}

const VideoCard: React.FC<{ video: VideoResult }> = ({ video }) => {
    const thumbnailUrl = `${import.meta.env.VITE_BACKEND_HOST}/videos/${
        video.uniqueFileName
    }/thumbnail.jpg`;
    const uploaderAvatarUrl = `${import.meta.env.VITE_BACKEND_HOST}${
        video.uploader.avatar
    }`;

    return (
        <div className="w-full h-56 flex flex-row gap-5 hover:bg-primary/10 p-2 rounded-md transition-colors items-start">
            <Link
                to={`/videos/watch/${video._id}`}
                className="h-full max-w-[40%]"
            >
                <img
                    src={thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover rounded-md"
                />
            </Link>

            <Link
                to={`/videos/watch/${video._id}`}
                className="flex flex-col items-start h-fit gap-1"
            >
                <h3 className="font-medium line-clamp-2 text-xl">
                    {video.title}
                </h3>

                <p className="text-xs text-muted-foreground">
                    {video.metrics.views} views •{" "}
                    {formatRelativeTime(video.createdAt)}
                </p>

                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                    <img
                        src={uploaderAvatarUrl}
                        alt={video.uploader.name}
                        className="size-8 rounded-full object-cover"
                    />
                    {video.uploader.name}
                </p>

                <p className="mt-2.5 line-clamp-2 text-sm text-muted-foreground">
                    {video.description}
                </p>
            </Link>
        </div>
    );

    // return (
    //     <Link
    //         to={`/videos/watch/${video._id}`}
    //         className="group flex flex-col rounded-xl h-fit overflow-hidden bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
    //     >
    //         {/* Thumbnail */}
    //         <div className="relative aspect-video bg-muted overflow-hidden">
    //             <img
    //                 src={thumbnailUrl}
    //                 alt={video.title}
    //                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    //             />
    //             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
    //                 <PlayCircle className="size-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
    //             </div>
    //             {/* Resolution badge */}
    //             <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs font-medium rounded">
    //                 {
    //                     video.availableResolutions[
    //                         video.availableResolutions.length - 1
    //                     ]
    //                 }
    //             </div>
    //         </div>

    //         {/* Content */}
    //         <div className="flex gap-3 p-3">
    //             {/* Uploader avatar */}
    //             <img
    //                 src={uploaderAvatarUrl}
    //                 alt={video.uploader.name}
    //                 className="size-9 rounded-full object-cover shrink-0 border border-border"
    //             />

    //             <div className="flex flex-col gap-1 min-w-0">
    //                 <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
    //                     {video.title}
    //                 </h3>
    //                 <p className="text-xs text-muted-foreground truncate">
    //                     {video.uploader.name}
    //                 </p>
    //                 <p className="text-xs text-muted-foreground">
    //                     {formattedDate}
    //                 </p>
    //             </div>
    //         </div>
    //     </Link>
    // );
};

const Home: React.FC = function () {
    const searchInputRef = useRef<HTMLInputElement>(null);
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const RESULTS_PER_PAGE = 10;

    const { data, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage } =
        useInfiniteQuery({
            queryKey: ["videos", "search", searchQuery],
            queryFn: async ({ pageParam = 1 }) => {
                const response = await api.get(
                    `/api/videos/search?q=${searchQuery}&page=${pageParam}&limit=${RESULTS_PER_PAGE}`
                );
                return response.data as VideoResult[];
            },
            getNextPageParam: (lastPage, allPages) => {
                // If the last page has fewer results than RESULTS_PER_PAGE, there are no more pages
                if (lastPage.length < RESULTS_PER_PAGE) {
                    return undefined;
                }
                return allPages.length + 1;
            },
            initialPageParam: 1,
            enabled: searchQuery.trim().length > 0,
        });

    // Flatten all pages into a single array
    const allResults = data?.pages.flatMap((page) => page) ?? [];
    const isInitialSearch = searchQuery.trim().length > 0;

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
            {
                threshold: 0.1,
            }
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

    const handleSearch: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        const query = searchInputRef.current?.value?.trim();

        if (!query) return;

        setSearchQuery(query);
    };

    return (
        <div className="gap-3 w-full h-full flex flex-col items-center">
            {/* Nav bar */}
            <section className="flex w-full items-center justify-end gap-10 mr-6">
                <form onSubmit={handleSearch} className="relative">
                    <Input
                        ref={searchInputRef}
                        placeholder="Search videos ..."
                        className="rounded-full pr-10 pl-5 py-5 w-md md:text-base"
                    />

                    <Button
                        type="submit"
                        className="absolute right-3 top-1/2 -translate-y-[calc(50%+0.05rem)] size-4.5 cursor-pointer"
                        variant={"ghost"}
                        disabled={isFetching}
                    >
                        {isFetching ? (
                            <Loader2 className="size-4.5 animate-spin" />
                        ) : (
                            <SearchIcon className="size-4.5" />
                        )}
                    </Button>
                </form>

                <Link
                    to="/upload"
                    className="flex text-sm gap-2 rounded-full bg-primary/10 px-4.5 py-2.5 cursor-pointer hover:bg-primary/20 transition-colors items-center"
                >
                    Upload
                    <UploadIcon className="size-4" />
                </Link>
            </section>

            {/* Loading State - Initial Search */}
            {isFetching && !isFetchingNextPage && (
                <section className="flex-1 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Searching videos...</p>
                </section>
            )}

            {/* Welcome State - No search performed yet */}
            {!isInitialSearch && (
                <section className="flex-1 flex flex-col items-center justify-center gap-4 mb-25">
                    <h1 className="text-4xl font-semibold text-center">
                        Welcome to VideoMate
                    </h1>

                    <p className="text-lg text-center text-muted-foreground max-w-lg">
                        Start by searching for videos or uploading your own
                        content to share with the world!
                    </p>
                </section>
            )}

            {/* Empty Results State */}
            {!isFetching && isInitialSearch && allResults.length === 0 && (
                <section className="flex-1 flex flex-col items-center justify-center gap-4">
                    <VideoOff className="size-18 text-muted-foreground" />

                    <h2 className="text-2xl font-semibold text-center">
                        No videos found
                    </h2>
                    <p className="text-muted-foreground text-center max-w-md">
                        We couldn't find any videos matching your search. Try
                        different keywords or upload your own video!
                    </p>
                </section>
            )}

            {/* Video Results Grid */}
            {isInitialSearch && allResults.length > 0 && (
                <section className="w-full flex-1 px-4 pb-8 overflow-y-auto flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold">
                            Search Results
                        </h2>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        {allResults.map((video) => (
                            <VideoCard key={video._id} video={video} />
                        ))}
                    </div>

                    {/* Load more trigger */}
                    {hasNextPage && (
                        <div
                            ref={loadMoreRef}
                            className="flex justify-center py-8"
                        >
                            {isFetchingNextPage ? (
                                <Loader2 className="size-6 animate-spin text-primary" />
                            ) : (
                                <p className="text-muted-foreground">
                                    Scroll to load more...
                                </p>
                            )}
                        </div>
                    )}

                    {!hasNextPage && allResults.length > 0 && (
                        <div className="flex justify-center py-8">
                            <p className="text-sm text-muted-foreground">
                                No more videos to load
                            </p>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

export default Home;
