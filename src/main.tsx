import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import Router from "@/app/Routing";
import { Provider } from "react-redux";
import store from "@/app/store";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./app/query-client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <Router />

                <Toaster
                    position="bottom-right"
                    richColors
                    theme="system"
                    className="select-none"
                />
                <ReactQueryDevtools
                    initialIsOpen={false}
                    client={queryClient}
                />
            </QueryClientProvider>
        </Provider>
    </StrictMode>
);
