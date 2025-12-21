import { useAppSelector } from "@/app/hooks";

type DashboardProps = {};

const Dashboard: React.FC<DashboardProps> = function () {
    const userName = useAppSelector((state) => state.auth.userInfo?.name);

    return (
        <section className="min-h-svh w-full flex flex-col items-center justify-center">
            <div className="text-4xl">Hey there, {userName}!</div>
        </section>
    );
};

export default Dashboard;
