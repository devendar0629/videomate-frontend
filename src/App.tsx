import { useSearchParams } from "react-router";
import "./App.css";
import VideoPlayer from "./components/VideoPlayer";

function App() {
    const [params] = useSearchParams();

    const playerOptions = {
        controls: true,
        responsive: true,
        fluid: true,
        sources: [
            {
                // 360p HLS
                src: `http://localhost:3000/videos/${params.get(
                    "url"
                )}/index.m3u8`,
                type: "application/vnd.apple.mpegurl",
            },
        ],
    };

    const handlePlayerReady = (player: any) => {
        // you can do things like:
        player.on("waiting", () => {
            console.log("player is waiting");
        });
        player.on("dispose", () => {
            console.log("player will dispose");
        });
    };

    return <VideoPlayer options={playerOptions} onReady={handlePlayerReady} />;
}

export default App;
