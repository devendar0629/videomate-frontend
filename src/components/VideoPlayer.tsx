// VideoPlayer.tsx
import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

interface VideoPlayerProps {
    options: any;
    onReady?: (player: any) => void;
}

/**
 * A React + TypeScript wrapper around Video.js
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({ options, onReady }) => {
    const videoRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        // Only initialize once
        if (!playerRef.current && videoRef.current) {
            // Create a <video-js> element
            const videoElement = document.createElement("video-js");
            videoElement.classList.add("vjs-big-play-centered");
            videoRef.current.appendChild(videoElement);

            // Initialize Video.js player
            const player = videojs(videoElement, options, () => {
                console.log("Video.js player is ready");
                onReady?.(player);
            });

            playerRef.current = player;
        } else if (playerRef.current) {
            // If options change, update as needed
            const player = playerRef.current;
            player.autoplay(options.autoplay ?? false);
            player.src(options.sources ?? []);
        }
    }, [options, onReady]);

    // Cleanup on unmount
    useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, []);

    return (
        <div className="min-w-4xl rounded-md overflow-hidden" data-vjs-player>
            <div ref={videoRef} />
        </div>
    );
};

export default VideoPlayer;
