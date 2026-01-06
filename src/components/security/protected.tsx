import api from "@/app/api";
import { login, logout, setAccessToken } from "@/app/features/auth.slice";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AxiosError } from "axios";
import { Loader } from "lucide-react";
import { useEffect, useLayoutEffect } from "react";
import { Outlet, useNavigate } from "react-router";

type ProtectedProps = {
    allowType: "ONLY_AUTHENTICATED" | "ONLY_UNAUTHENTICATED";
};

export default function Protected({ allowType }: ProtectedProps) {
    const isAuthenticated = useAppSelector(
        (state) => state.auth.isAuthenticated
    );
    const accessToken = useAppSelector((state) => state.auth.accessToken);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Check current authentication status on component mount
    useEffect(() => {
        const fetchCurrentAuthStatus = async () => {
            return await api.get("/auth/me");
        };

        fetchCurrentAuthStatus()
            .then((response) => {
                if (response.status !== 200) {
                    throw new Error("Not authenticated");
                }

                const data = response.data;

                dispatch(
                    login({
                        accessToken: data.accessToken,
                        userInfo: data.user,
                    })
                );
            })
            .catch(() => {
                dispatch(logout());
            });
    }, [dispatch]);

    // Intercept API requests to add accessToken to Authorization header
    useLayoutEffect(() => {
        const injectAccessTokenInterceptor = api.interceptors.request.use(
            (config) => {
                if (accessToken) {
                    config.headers.Authorization = `Bearer ${accessToken}`;
                }

                return config;
            }
        );

        return () => {
            api.interceptors.request.eject(injectAccessTokenInterceptor);
        };
    }, [accessToken]);

    useLayoutEffect(() => {
        const renewAccessTokenInterceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                if (
                    error instanceof AxiosError &&
                    error.response?.status === 401
                ) {
                    const originalRequestConfig = error.config;

                    if (!originalRequestConfig?.headers) {
                        return Promise.reject(error);
                    }

                    const isAuthRequiredForThisRequest =
                        !/^\/auth\/(login|signup)$/.test(
                            originalRequestConfig.url || ""
                        ); // Shouldn't be a request to login or signup

                    if (!isAuthRequiredForThisRequest) {
                        // No need to renew token for auth endpoints like login or signup
                        return Promise.reject(error);
                    }

                    if (originalRequestConfig.url === "/auth/token") {
                        // Prevent infinite loop if token renewal fails
                        return Promise.reject(error);
                    }

                    try {
                        const response = await api.post("/auth/token");

                        if (response.status !== 200) {
                            throw new Error("Request failed");
                        }

                        dispatch(setAccessToken(response.data.accessToken));

                        originalRequestConfig.headers.Authorization = `Bearer ${response.data.accessToken}`;

                        return api(originalRequestConfig);
                    } catch {
                        throw error; // Throw the original error if token renewal fails
                    }
                } else {
                    return Promise.reject(error);
                }
            }
        );

        return () => {
            api.interceptors.response.eject(renewAccessTokenInterceptor);
        };
    }, [dispatch]);

    // Redirect based on authentication status
    useEffect(() => {
        // Still checking authentication status
        if (isAuthenticated === undefined) {
            return;
        }

        if (allowType === "ONLY_AUTHENTICATED" && !isAuthenticated) {
            navigate("/auth/login");
        }
        if (allowType === "ONLY_UNAUTHENTICATED" && isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);

    // Handle loading state
    if (isAuthenticated === undefined) {
        return (
            <div className="flex justify-center items-center h-screen gap-2">
                <Loader className="mb-0.5 size-5 animate-spin mx-auto" />{" "}
                Loading ...
            </div>
        );
    }

    if (
        (allowType === "ONLY_AUTHENTICATED" && !isAuthenticated) ||
        (allowType === "ONLY_UNAUTHENTICATED" && isAuthenticated)
    ) {
        // Show loading state before redirecting to appropriate page by useEffect after this render
        return (
            <div className="flex justify-center items-center h-screen gap-2">
                <Loader className="mb-0.5 size-5 animate-spin mx-auto" />{" "}
                Loading ...
            </div>
        );
    }

    return <Outlet />;
}
