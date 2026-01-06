import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

type VideoPlayerProps = {
    options: any;
    onReady?: (player: any) => void;
    qualities?: Array<{ label: string; src: string }>;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    options,
    onReady,
    qualities,
}) => {
    const videoRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
            const videoElement = document.createElement("video-js");

            videoElement.classList.add("vjs-big-play-centered");
            videoRef.current?.appendChild(videoElement);

            const player = (playerRef.current = videojs(
                videoElement,
                options,
                () => {
                    videojs.log("player is ready");

                    // Add quality selector if qualities are provided
                    if (qualities && qualities.length > 0) {
                        const MenuButton = videojs.getComponent("MenuButton");
                        const MenuItem = videojs.getComponent("MenuItem");

                        class QualityMenuItem extends MenuItem {
                            constructor(player: any, options: any) {
                                super(player, options);
                                this.selected(options.selected);
                            }

                            handleClick() {
                                const currentTime = this.player().currentTime();
                                const isPaused = this.player().paused();

                                // Update source
                                this.player().src({
                                    src: this.options_.src,
                                    type: "application/x-mpegURL",
                                });

                                // Restore playback position
                                this.player().one("loadedmetadata", () => {
                                    this.player().currentTime(currentTime);
                                    if (!isPaused) {
                                        this.player().play();
                                    }
                                });
                            }
                        }

                        class QualitySelector extends MenuButton {
                            constructor(player: any, options: any) {
                                super(player, options);
                                this.controlText("Quality");
                            }

                            buildCSSClass() {
                                return `vjs-quality-selector vjs-icon-cog ${super.buildCSSClass()}`;
                            }

                            createItems() {
                                const qualities = this.options_.qualities || [];
                                return qualities.map(
                                    (quality: any, index: number) => {
                                        return new QualityMenuItem(
                                            this.player(),
                                            {
                                                label: quality.label,
                                                src: quality.src,
                                                selected: index === 0,
                                            }
                                        );
                                    }
                                );
                            }
                        }

                        videojs.registerComponent(
                            "QualitySelector",
                            QualitySelector
                        );

                        const qualitySelector = player.controlBar.addChild(
                            "QualitySelector",
                            { qualities }
                        );

                        player.controlBar
                            .el()
                            .insertBefore(
                                qualitySelector.el(),
                                player.controlBar
                                    .getChild("fullscreenToggle")
                                    .el()
                            );
                    }

                    onReady?.(player);
                }
            ));

            // You could update an existing player in the `else` block here
            // on prop change, for example:
        } else {
            const player = playerRef.current;

            player.autoplay(options.autoplay);
            player.src(options.sources);
        }
    }, [options, videoRef, qualities, onReady]);

    useEffect(() => {
        const player = playerRef.current;

        return () => {
            if (player && !player.isDisposed()) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [playerRef]);

    return (
        <div data-vjs-player>
            <div ref={videoRef} />
        </div>
    );
};

export default VideoPlayer;
export type { VideoPlayerProps };
