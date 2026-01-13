import { BrowserRouter, Route, Routes } from "react-router";
import RootLayout from "@/app/root-layout";
import App from "@/App";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import Protected from "@/components/security/protected";
import Home from "@/components/home";
import Profile from "@/components/profile";
import AuthenticatedLayout from "../layouts/authenticated-layout";
import UploadVideo from "@/pages/upload-video";
import EditProfile from "@/pages/edit-profile";
import AllVideoDetails from "@/pages/all-video-details";
import VideoDetails from "@/pages/video-detail";
import WatchVideo from "@/pages/watch-video";
import EditVideo from "@/pages/edit-video";
import LikedVideos from "@/pages/liked-videos";
import DislikedVideos from "@/pages/disliked-videos";

export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RootLayout />} path="">
                    <Route
                        element={<Protected allowType="ONLY_UNAUTHENTICATED" />}
                    >
                        <Route path="/auth">
                            <Route path="login" element={<LoginPage />} />
                            <Route path="signup" element={<SignupPage />} />
                        </Route>
                    </Route>

                    <Route
                        element={<Protected allowType="ONLY_AUTHENTICATED" />}
                    >
                        <Route element={<AuthenticatedLayout />}>
                            <Route index element={<Home />} />
                            <Route path="/app" element={<App />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route
                                path="/profile/edit"
                                element={<EditProfile />}
                            />
                            <Route path="/upload" element={<UploadVideo />} />

                            <Route
                                path="/videos/watch/:videoId"
                                element={<WatchVideo />}
                            />
                            <Route path="/my-videos">
                                <Route index element={<AllVideoDetails />} />

                                <Route path="liked" element={<LikedVideos />} />

                                <Route
                                    path="disliked"
                                    element={<DislikedVideos />}
                                />

                                <Route
                                    path=":videoId"
                                    element={<VideoDetails />}
                                />

                                <Route
                                    path=":videoId/edit"
                                    element={<EditVideo />}
                                />
                            </Route>
                        </Route>
                    </Route>

                    <Route path="*" element={<div>404 Not Found</div>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
