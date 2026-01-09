import api from "@/app/api";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import UploadDialog from "@/components/upload-video-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { LoaderIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import z from "zod";

const editVideoFormSchema = z.object({
    file: z
        .instanceof(File)
        .refine(
            (file) => file.size === 0 || file.type.startsWith("video/"),
            "Please upload a valid video file"
        )
        .refine(
            (file) => file.size === 0 || file.size <= 500 * 1024 * 1024,
            "File size must be under 500MB"
        )
        .optional(),
    title: z
        .string()
        .trim()
        .min(1, "Title must not be empty")
        .max(200, "Title must be at most 200 characters")
        .optional(),
    description: z
        .string()
        .max(1024, "Description must be at most 1024 characters")
        .optional(),
    visibility: z.enum(["private", "public"]).optional(),
});

type EditVideoFormData = z.infer<typeof editVideoFormSchema>;

interface VideoData {
    _id: string;
    title: string;
    description: string;
    visibility: "private" | "public";
    originalFileName: string;
    status: string;
}

const EditVideo: React.FC = function () {
    const { videoId } = useParams<{ videoId: string }>();
    const navigate = useNavigate();

    // Fetch video details
    const {
        data: videoData,
        isFetching,
        isError,
    } = useQuery<VideoData>({
        queryKey: ["video", videoId],
        queryFn: async () => {
            const response = await api.get(`/api/videos/${videoId}`);
            return response.data;
        },
        enabled: !!videoId,
        staleTime: 0,
    });

    const { mutateAsync: updateVideoMutation, isPending: isUpdating } =
        useMutation({
            mutationFn: async (data: FormData) => {
                return api.patch(`/api/videos/${videoId}`, data, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            },
        });

    const form = useForm<EditVideoFormData>({
        resolver: zodResolver(editVideoFormSchema),
        defaultValues: {
            title: "",
            description: "",
            visibility: "private",
            file: undefined,
        },
    });

    // Reset form with fetched video data
    useEffect(() => {
        if (videoData) {
            // form.resetField("visibility", {
            //     defaultValue: videoData.visibility,
            // });

            form.reset({
                title: videoData.title,
                description: videoData.description || "",
                visibility: videoData.visibility,
                file: undefined,
            });
        }
    }, [videoData, form]);

    const onSubmit: SubmitHandler<EditVideoFormData> = async (data) => {
        try {
            const formData = new FormData();
            let hasChanges = false;

            // Only append fields that have changed
            if (data.title && data.title !== videoData?.title) {
                formData.append("title", data.title);
                hasChanges = true;
            }

            if (
                data.description !== undefined &&
                data.description !== videoData?.description
            ) {
                formData.append("description", data.description);
                hasChanges = true;
            }

            if (data.visibility && data.visibility !== videoData?.visibility) {
                formData.append("visibility", data.visibility);
                hasChanges = true;
            }

            if (data.file && data.file.size > 0) {
                formData.append("file", data.file);
                hasChanges = true;
            }

            if (!hasChanges) {
                form.setError("root", {
                    message:
                        "No changes detected. Please modify at least one field.",
                });
                return;
            }

            const response = await updateVideoMutation(formData);

            if (response.status !== 200) {
                throw new Error();
            }

            navigate(`/my-videos/${videoId}`);
        } catch (error) {
            if (error instanceof AxiosError && error.response) {
                const errorCode = error.response.data.errorCode;

                if (errorCode === "INVALID_PAYLOAD") {
                    const errors = error.response.data.errors;

                    for (const error of errors) {
                        form.setError(error.field, {
                            message: error.error,
                        });
                    }
                } else {
                    form.setError("root", {
                        message:
                            "An unexpected error occurred. Please try again.",
                    });
                }
            } else {
                form.setError("root", {
                    message: "An unexpected error occurred. Please try again.",
                });
            }
        }
    };

    if (!isFetching && (isError || !videoData)) {
        return (
            <section className="flex justify-center items-center min-h-[60vh]">
                <div className="text-xl text-destructive">
                    Failed to load video. Please try again.
                </div>
            </section>
        );
    }

    return (
        <section className="flex flex-col gap-5">
            <h1 className="text-2xl font-bold mb-4">Edit Video</h1>

            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-full flex flex-col gap-4.5"
            >
                {/* Title */}
                <Controller
                    name="title"
                    control={form.control}
                    disabled={isFetching || !videoData}
                    render={({ field, fieldState }) => {
                        return (
                            <Field
                                data-invalid={fieldState.invalid}
                                className="gap-2"
                            >
                                <FieldLabel htmlFor={field.name}>
                                    Title
                                </FieldLabel>

                                <Input
                                    aria-invalid={fieldState.invalid}
                                    {...field}
                                    className="max-w-xl"
                                />

                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        );
                    }}
                />

                {/* Description */}
                <Controller
                    name="description"
                    control={form.control}
                    disabled={isFetching || !videoData}
                    render={({ field, fieldState }) => {
                        return (
                            <Field
                                className="gap-2"
                                data-invalid={fieldState.invalid}
                            >
                                <FieldLabel
                                    className="font-medium"
                                    htmlFor={field.name}
                                >
                                    Description
                                </FieldLabel>

                                <Textarea
                                    style={{
                                        scrollbarWidth: "thin",
                                        scrollbarColor: "#cbd5e1 transparent",
                                    }}
                                    className="max-w-xl min-h-20 max-h-46 resize-none"
                                    aria-invalid={fieldState.invalid}
                                    {...field}
                                />

                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        );
                    }}
                />

                {/* Visibility */}
                <Controller
                    name="visibility"
                    control={form.control}
                    disabled={isFetching || !videoData}
                    render={({ field, fieldState }) => {
                        return (
                            <Field
                                className="gap-2 w-fit"
                                data-invalid={fieldState.invalid}
                            >
                                <FieldContent>
                                    <FieldLabel htmlFor="visibility">
                                        Visibility
                                    </FieldLabel>

                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    )}
                                </FieldContent>

                                <Select
                                    name={field.name}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger
                                        id="visibility"
                                        className="max-w-fit"
                                    >
                                        <SelectValue placeholder="Visibility" />
                                    </SelectTrigger>

                                    <SelectContent className="font-[Google_Sans_Flex]">
                                        <SelectItem value="private">
                                            Private
                                        </SelectItem>
                                        <SelectItem value="public">
                                            Public
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} />
                                )}
                            </Field>
                        );
                    }}
                />

                {/* Video File (Optional) */}
                <Controller
                    name="file"
                    disabled={isFetching || !videoData}
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field
                            data-invalid={fieldState.invalid}
                            className="gap-2"
                        >
                            <FieldLabel>
                                Replace Video File (Optional)
                            </FieldLabel>

                            <UploadDialog
                                disabled={isFetching || !videoData}
                                onFileSelect={(selectedFile) => {
                                    field.onChange(selectedFile);
                                }}
                            />

                            {fieldState.invalid && (
                                <FieldError errors={[fieldState.error]} />
                            )}
                        </Field>
                    )}
                />

                {form.formState.errors.root && (
                    <FieldError className="text-red-600 font-medium">
                        {form.formState.errors.root.message}
                    </FieldError>
                )}

                <div className="flex gap-3 mt-4">
                    <Button
                        disabled={form.formState.isSubmitting || isUpdating}
                        type="submit"
                        size={"lg"}
                        className="w-fit"
                    >
                        {(form.formState.isSubmitting || isUpdating) && (
                            <LoaderIcon className="animate-spin size-4" />
                        )}
                        Update Video
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size={"lg"}
                        onClick={() => navigate(-1)}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </section>
    );
};

export default EditVideo;
