import { BrowserRouter, Route, Routes } from "react-router";
import RootLayout from "@/app/RootLayout";
import App from "@/App";
import LoginPage from "@/pages/login";
import SignupPage from "@/pages/signup";
import Protected from "@/components/security/protected";
import Dashboard from "@/components/dashboard";

export default function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<RootLayout />} path="">
                    <Route
                        path=""
                        element={<Protected allowType="ONLY_UNAUTHENTICATED" />}
                    >
                        <Route path="/auth">
                            <Route path="login" element={<LoginPage />} />
                            <Route path="signup" element={<SignupPage />} />
                        </Route>
                    </Route>

                    <Route
                        path=""
                        element={<Protected allowType="ONLY_AUTHENTICATED" />}
                    >
                        <Route path="/app" element={<App />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                    </Route>

                    <Route path="*" element={<div>404 Not Found</div>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
