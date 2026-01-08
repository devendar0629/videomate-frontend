import {
    SearchIcon,
    UploadIcon,
    PlayCircle,
    Loader2,
    VideoOff,
} from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Link } from "react-router";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/app/api";

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
}

const VideoCard: React.FC<{ video: VideoResult }> = ({ video }) => {
    const thumbnailUrl = `${import.meta.env.VITE_BACKEND_HOST}/videos/${
        video.uniqueFileName
    }/thumbnail.jpg`;
    const formattedDate = new Date(video.createdAt).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    );
    const uploaderAvatarUrl = `${import.meta.env.VITE_BACKEND_HOST}${
        video.uploader.avatar
    }`;

    return (
        <Link
            to={`/videos/watch/${video._id}`}
            className="group flex flex-col rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
        >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-muted overflow-hidden">
                <img
                    src={thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <PlayCircle className="size-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                </div>
                {/* Resolution badge */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs font-medium rounded">
                    {
                        video.availableResolutions[
                            video.availableResolutions.length - 1
                        ]
                    }
                </div>
            </div>

            {/* Content */}
            <div className="flex gap-3 p-3">
                {/* Uploader avatar */}
                <img
                    src={uploaderAvatarUrl}
                    alt={video.uploader.name}
                    className="size-9 rounded-full object-cover shrink-0 border border-border"
                />

                <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {video.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                        {video.uploader.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {formattedDate}
                    </p>
                </div>
            </div>
        </Link>
    );
};

const Home: React.FC = function () {
    const searchInputRef = useRef<HTMLInputElement>(null);

    const {
        data: videoSearchResults,
        isFetching: isSearchingVideos,
        refetch: fetchVideoSearchResults,
    } = useQuery<VideoResult[] | null>({
        queryKey: ["videos", "search"],
        queryFn: async () => {
            const query = searchInputRef.current?.value?.trim();

            if (!query) return null;

            const response = await api.get(`/api/videos/search?q=${query}`);
            return response.data;
        },
        enabled: false,
    });

    const handleSearch: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        const query = searchInputRef.current?.value;

        if (!query?.trim()) return;

        fetchVideoSearchResults();
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
                        disabled={isSearchingVideos}
                    >
                        {isSearchingVideos ? (
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

            {/* Loading State */}
            {isSearchingVideos && (
                <section className="flex-1 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="size-10 animate-spin text-primary" />
                    <p className="text-muted-foreground">Searching videos...</p>
                </section>
            )}

            {/* Welcome State - No search performed yet */}
            {!isSearchingVideos && videoSearchResults === undefined && (
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
            {!isSearchingVideos &&
                videoSearchResults !== undefined &&
                videoSearchResults?.length === 0 && (
                    <section className="flex-1 flex flex-col items-center justify-center gap-4">
                        <VideoOff className="size-18 text-muted-foreground" />

                        <h2 className="text-2xl font-semibold text-center">
                            No videos found
                        </h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            We couldn't find any videos matching your search.
                            Try different keywords or upload your own video!
                        </p>
                    </section>
                )}

            {/* Video Results Grid */}
            {!isSearchingVideos &&
                videoSearchResults &&
                videoSearchResults.length > 0 && (
                    <section className="w-full flex-1 px-4 pb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold">
                                Search Results
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({videoSearchResults.length} video
                                    {videoSearchResults.length !== 1 ? "s" : ""}
                                    )
                                </span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                            {videoSearchResults.map((video) => (
                                <VideoCard key={video._id} video={video} />
                            ))}
                        </div>
                    </section>
                )}
        </div>
    );
};

export default Home;
