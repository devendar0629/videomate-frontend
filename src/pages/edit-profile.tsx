import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router";
import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
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
import { Input } from "@/components/ui/input";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { toast } from "sonner";
import { LoaderIcon } from "lucide-react";

interface UserProfileData {
    message: string;
    data: {
        user: {
            avatar?: string;
            name: string;
        };
    };
}

const editProfileSchema = z
    .object({
        name: z
            .string()
            .optional()
            .refine(
                (val) => {
                    if (val && val.trim().length > 0) {
                        return val.trim().length >= 2;
                    }
                    return true;
                },
                { message: "Name must be at least 2 characters" }
            )
            .refine(
                (val) => {
                    if (val && val.trim().length > 0) {
                        return val.trim().length <= 100;
                    }
                    return true;
                },
                { message: "Name must be at most 100 characters" }
            ),
        avatar: z
            .instanceof(FileList)
            .optional()
            .refine(
                (files) => {
                    if (!files || files.length === 0) return true;
                    const file = files[0];
                    return file.size <= 2 * 1024 * 1024; // 2MB
                },
                { message: "File size must be less than 2MB" }
            )
            .refine(
                (files) => {
                    if (!files || files.length === 0) return true;
                    const file = files[0];
                    return [
                        "image/jpeg",
                        "image/jpg",
                        "image/png",
                        "image/webp",
                    ].includes(file.type);
                },
                { message: "Only JPEG, PNG, and WebP images are allowed" }
            ),
    })
    .refine(
        (data) => {
            const hasName = data.name && data.name.trim().length > 0;
            const hasAvatar = data.avatar && data.avatar.length > 0;
            return hasName || hasAvatar;
        },
        {
            message: "Please update at least one field (name or avatar)",
            path: ["name"],
        }
    );

type EditProfileFormData = z.infer<typeof editProfileSchema>;

const EditProfile: React.FC = function () {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [avatarPreview, setAvatarPreview] = useState<string>("");

    const {
        register,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        setError,
        setValue,
        watch,
    } = useForm<EditProfileFormData>({
        resolver: zodResolver(editProfileSchema),
    });

    const avatarFiles = watch("avatar");

    const { data, isLoading, error } = useQuery<UserProfileData>({
        queryKey: ["userProfile"],
        queryFn: async () => {
            const response = await api.get("/api/users/profile");
            return response.data;
        },
    });

    useEffect(() => {
        if (data?.data.user) {
            setValue("name", data.data.user.name);

            if (data.data.user.avatar) {
                setAvatarPreview(
                    `${import.meta.env.VITE_BACKEND_HOST}${
                        data.data.user.avatar
                    }`
                );
            }
        }
    }, [data, setValue]);

    useEffect(() => {
        if (avatarFiles && avatarFiles.length > 0) {
            const file = avatarFiles[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [avatarFiles]);

    const updateMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            const response = await api.patch("/api/users/profile", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success("Profile updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["userProfile"] });

            navigate("/profile");
        },
        onError: (error: AxiosError<any>) => {
            if (error.response?.data?.errorCode === "INVALID_PAYLOAD") {
                const errors = error.response.data.errors;
                if (Array.isArray(errors)) {
                    errors.forEach((err: any) => {
                        setError(err.field as keyof EditProfileFormData, {
                            message: err.error,
                        });
                    });
                } else {
                    toast.error("Invalid form data. Please check your inputs.");
                }
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.message) {
                toast.error(error.message);
            } else {
                toast.error("Failed to update profile. Please try again.");
            }
        },
    });

    const handleSubmit: SubmitHandler<EditProfileFormData> = async (data) => {
        const formData = new FormData();

        if (data.name && data.name.trim().length > 0) {
            formData.append("name", data.name.trim());
        }

        if (data.avatar && data.avatar.length > 0) {
            formData.append("file", data.avatar[0]);
        }

        updateMutation.mutate(formData);
    };

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

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Edit Profile</CardTitle>
                    <CardDescription>
                        Update your account information
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleFormSubmit(handleSubmit)}>
                    <CardContent className="space-y-6">
                        <FieldGroup>
                            {/* Avatar Upload */}
                            <Field className="gap-2">
                                <div className="flex flex-col items-center gap-4">
                                    {avatarPreview && (
                                        <div className="relative">
                                            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-primary/10 shadow-lg">
                                                <img
                                                    src={avatarPreview}
                                                    alt="Profile preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="w-full">
                                        <FieldLabel htmlFor="avatar">
                                            Profile Picture
                                        </FieldLabel>
                                        <Input
                                            {...register("avatar")}
                                            id="avatar"
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                            className="mt-1"
                                        />
                                        {errors.avatar && (
                                            <FieldError>
                                                {errors.avatar.message}
                                            </FieldError>
                                        )}
                                    </div>
                                </div>
                            </Field>

                            {/* Name Input */}
                            <Field className="gap-2">
                                <FieldLabel htmlFor="name">Name</FieldLabel>
                                <Input
                                    {...register("name")}
                                    id="name"
                                    type="text"
                                    placeholder="Enter your name"
                                />
                                {errors.name && (
                                    <FieldError>
                                        {errors.name.message}
                                    </FieldError>
                                )}
                            </Field>

                            {/* Root errors for form-level validation */}
                            {errors.root && (
                                <FieldError>{errors.root.message}</FieldError>
                            )}
                        </FieldGroup>
                    </CardContent>

                    <CardFooter className="flex gap-3 mt-8">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            asChild
                        >
                            <Link to="/profile">Cancel</Link>
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending && (
                                <LoaderIcon className="animate-spin size-4" />
                            )}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default EditProfile;
