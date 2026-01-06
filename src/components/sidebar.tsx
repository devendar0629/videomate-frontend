import { HomeIcon, LogOutIcon, SettingsIcon, VideoIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Link, useNavigate } from "react-router";
import api from "@/app/api";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { logout as storeLogout } from "@/app/features/auth.slice";

type SidebarLinkProps = {
    to: string;
    label: string;
    icon?: React.ReactNode;
    className?: string;
};

const SidebarLink: React.FC<SidebarLinkProps> = function ({
    to,
    label,
    icon,
    className,
}) {
    return (
        <Link
            to={to}
            className={`px-3 flex gap-3 items-center py-2 rounded-md hover:bg-primary/20 transition-colors ${className}`}
        >
            {icon}
            <span className="text-sm mt-0.5">{label}</span>
        </Link>
    );
};

const LogoutButton = function () {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = async () => {
        try {
            const response = await api.post("/auth/logout");

            if (response.status === 200) {
                dispatch(storeLogout());
                navigate("/auth/login");
            } else {
                throw new Error("Logout failed");
            }
        } catch (error) {
            toast.error("Failed to logout. Please try again.");
        }
    };

    return (
        <Button
            className="w-full"
            variant={"destructive"}
            onClick={handleLogout}
        >
            Logout <LogOutIcon className="size-3.5" />
        </Button>
    );
};

const Sidebar = function () {
    return (
        <div className="flex flex-col w-full h-full py-5 bg-secondary gap-10 border-r border-pink-400">
            <h2 className="text-[1.4rem] font-bold px-6 text-pink-400">
                VideoMate
            </h2>

            <div
                style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "rgba(255, 255, 255, 0.2) transparent",
                }}
                className="flex px-4.5 flex-col gap-2.5 overflow-auto"
            >
                <SidebarLink icon={<HomeIcon />} to="/" label="Home" />
                <SidebarLink
                    icon={<VideoIcon />}
                    to="/my-videos"
                    label="My Videos"
                />
                <SidebarLink
                    icon={<SettingsIcon />}
                    to="/settings"
                    label="Settings"
                />
            </div>

            <div className="mt-auto px-6">
                <LogoutButton />
            </div>
        </div>
    );
};

export type { SidebarLinkProps };
export default Sidebar;
