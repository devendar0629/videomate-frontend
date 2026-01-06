import { useAppSelector } from "@/app/hooks";
import { Link } from "react-router";

type ProfileProps = {};

const Profile: React.FC<ProfileProps> = function () {
    const userInfo = useAppSelector((state) => state.auth.userInfo);

    return (
        <div className="flex flex-col gap-3">
            <p>Name: {userInfo?.name}</p>
            <p>Email: {userInfo?.email}</p>

            <Link to="/dashboard" className="text-blue-500 underline">
                Go to Dashboard
            </Link>
        </div>
    );
};

export default Profile;
