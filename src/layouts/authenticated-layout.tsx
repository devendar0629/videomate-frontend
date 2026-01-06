import Sidebar from "@/components/sidebar";
import { Outlet } from "react-router";

type AuthenticatedLayoutProps = {};

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = function () {
    return (
        <div className="grid md:grid-cols-12 relative min-h-svh w-full text-white">
            <aside className="lg:col-span-2 md:col-span-3 sticky top-0 left-0 h-screen">
                <Sidebar />
            </aside>

            <div className="lg:col-span-10 md:col-span-9 w-full p-6">
                <Outlet />
            </div>
        </div>
    );
};

export default AuthenticatedLayout;
