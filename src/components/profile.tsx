import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import api from "@/app/api";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProfileProps = {};

interface UserProfileData {
    message: string;
    data: {
        user: {
            avatar: string;
            name: string;
            email: string;
        };
    };
}

const Profile: React.FC<ProfileProps> = function () {
    const { data, isLoading, error } = useQuery<UserProfileData>({
        queryKey: ["userProfile"],
        queryFn: async () => {
            const response = await api.get("/api/users/profile");
            return response.data;
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-muted-foreground">
                                Loading profile...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md border-red-200">
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <p className="text-red-600 font-medium">
                                Error loading profile
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Please try again later
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const user = data?.data.user;

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Profile</CardTitle>
                    <CardDescription>
                        View and manage your account information
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col items-center gap-6">
                    {user?.avatar && (
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary/10 shadow-lg">
                                <img
                                    src={`${import.meta.env.VITE_BACKEND_HOST}${
                                        user.avatar
                                    }`}
                                    alt={user.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    )}

                    <div className="w-full space-y-4">
                        <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                                Name
                            </p>
                            <p className="text-lg font-semibold">
                                {user?.name}
                            </p>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                                Email Address
                            </p>
                            <p className="text-lg font-semibold break-all">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex-col gap-3">
                    <Button asChild className="w-full">
                        <Link to="/profile/edit">Edit Profile</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link to="/dashboard">Go to Dashboard</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default Profile;
