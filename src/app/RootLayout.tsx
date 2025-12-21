import { Outlet } from "react-router";

export default function RootLayout() {
    return (
        <main className="font-google-sans-flex-regular min-h-svh w-full bg-background flex flex-col justify-center items-center text-white">
            <Outlet />
        </main>
    );
}
