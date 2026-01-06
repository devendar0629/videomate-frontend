import { SearchIcon, UploadIcon } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Link } from "react-router";

const Home: React.FC = function () {
    return (
        <section className="gap-3 w-full flex flex-col items-center justify-center">
            {/* Nav bar */}
            <section className="flex w-full items-center justify-end gap-10 mr-6">
                <div className="relative w-fit">
                    <Input
                        placeholder="Search videos ..."
                        className="rounded-full pr-10 pl-5 py-5 w-md md:text-base"
                    />

                    <Button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-[calc(50%+0.05rem)] size-4.5 cursor-pointer"
                        variant={"ghost"}
                    >
                        <SearchIcon className="size-4.5" />
                    </Button>
                </div>

                <Link
                    to="/upload"
                    className="flex text-sm gap-2 rounded-full bg-primary/10 px-4.5 py-2.5 cursor-pointer hover:bg-primary/20 transition-colors items-center"
                >
                    Upload
                    <UploadIcon className="size-4" />
                </Link>
            </section>
        </section>
    );
};

export default Home;
