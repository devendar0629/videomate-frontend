import api from "@/app/api";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { LoaderIcon } from "lucide-react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router";
import z from "zod";

type PublishVideoProps = {};

const publishVideoFormSchema = z.object({
    file: z
        .instanceof(File, {
            error: "Video file is required",
        })
        .refine((file) => file.size > 0, "Video file is required")
        .refine(
            (file) => !!file && file.type.startsWith("video/"),
            "Please upload a valid video file"
        )
        .refine(
            (file) => !!file && file.size <= 500 * 1024 * 1024,
            "File size must be under 500MB"
        ),
    title: z.string("Title is required").trim().min(1, "Title is required"),
    description: z
        .string()
        .max(1024, "Description must be at most 1024 characters")
        .optional(),
    visibility: z.enum(["private", "public"], "Visibility is required"),
});

type PublishVideoFormData = z.infer<typeof publishVideoFormSchema>;

const PublishVideo: React.FC<PublishVideoProps> = function () {
    const { mutateAsync: publishVideoMutation, isPending: isPublishing } =
        useMutation({
            mutationFn: async (data: PublishVideoFormData) => {
                const formData = new FormData();
                formData.append("file", data.file);
                formData.append("title", data.title);
                formData.append("description", data.description ?? "");
                formData.append("visibility", data.visibility);

                return api.postForm("/api/videos/publish", formData);
            },
        });

    const form = useForm<PublishVideoFormData>({
        resolver: zodResolver(publishVideoFormSchema),
        defaultValues: {
            title: "",
            description: "",
            visibility: "private",
            file: undefined,
        },
    });

    const navigate = useNavigate();

    const onSubmit: SubmitHandler<PublishVideoFormData> = async (data) => {
        try {
            const response = await publishVideoMutation(data);

            if (response.status !== 202) {
                throw new Error();
            }

            navigate(`/my-videos/${response.data.videoId}`);
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
                } else if (errorCode === "INVALID_CREDENTIALS") {
                    form.setError("root", {
                        message: "Invalid email or password.",
                    });
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

    return (
        <section className="flex flex-col gap-5">
            <h1 className="text-2xl font-bold mb-4">Upload a Video</h1>

            <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-full flex flex-col gap-4.5"
            >
                {/* VideoFile */}
                <Controller
                    name="file"
                    control={form.control}
                    render={({ field, fieldState }) => (
                        <Field
                            data-invalid={fieldState.invalid}
                            className="gap-2"
                        >
                            <FieldLabel>Select Video File</FieldLabel>

                            <UploadDialog
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

                <Controller
                    name="title"
                    control={form.control}
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

                <Controller
                    name="description"
                    control={form.control}
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

                <Controller
                    name="visibility"
                    control={form.control}
                    render={({ field, fieldState }) => {
                        return (
                            <Field
                                className="gap-2 w-fit"
                                data-invalid={fieldState.invalid}
                            >
                                <FieldLabel htmlFor="visibility">
                                    Visibility
                                </FieldLabel>

                                <Select
                                    name={field.name}
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="max-w-fit">
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

                {form.formState.errors.root && (
                    <FieldError className="text-red-600 font-medium">
                        {form.formState.errors.root.message}
                    </FieldError>
                )}

                <Button
                    disabled={form.formState.isSubmitting || isPublishing}
                    type="submit"
                    size={"lg"}
                    className="w-fit mt-4"
                >
                    {(form.formState.isSubmitting || isPublishing) && (
                        <LoaderIcon className="animate-spin size-4" />
                    )}
                    Publish Video
                </Button>
            </form>
        </section>
    );
};

export default PublishVideo;
