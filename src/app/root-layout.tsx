import { Outlet } from "react-router";

export default function RootLayout() {
    return (
        <main className="font-google-sans-flex-regular w-full min-h-svh bg-secondary flex flex-col justify-center items-center text-white">
            <Outlet />
        </main>
    );
}
