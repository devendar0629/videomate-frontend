import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "react-router";
import { EyeIcon, EyeOffIcon, LoaderIcon } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/app/api";
import { useForm, type SubmitHandler } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import { toast } from "sonner";

const signupFormSchema = z.object({
    name: z
        .string()
        .min(2, "Name must be at least 2 characters long")
        .max(64, "Name must be at most 64 characters long"),
    email: z.email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(64, "Password must be at most 64 characters long"),
});
type SignupFormData = z.infer<typeof signupFormSchema>;

export default function SignupForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        setError,
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupFormSchema),
    });

    const { mutateAsync: signupUser, isPending: isSigningUp } = useMutation({
        mutationFn: async (data: { email: string; password: string }) => {
            return api.post("/auth/signup", data, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
        },
    });

    const handleSubmit: SubmitHandler<SignupFormData> = async (data) => {
        try {
            const response = await signupUser(data);

            if (response.status !== 201) {
                throw new Error();
            }

            toast.success("Account created successfully! Please log in.");
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                const errorCode = err.response.data.errorCode;

                if (errorCode === "INVALID_PAYLOAD") {
                    const errors = err.response.data.errors;

                    for (const error of errors) {
                        setError(error.field, {
                            message: error.message,
                        });
                    }
                } else if (errorCode === "EMAIL_TAKEN") {
                    setError("email", {
                        message: "Email is already taken",
                    });
                } else {
                    setError("root", {
                        message:
                            "An unexpected error occurred. Please try again.",
                    });
                }
            } else {
                setError("root", {
                    message: "An unexpected error occurred. Please try again.",
                });
            }
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="px-1.5 py-7">
                <CardHeader>
                    <CardTitle className="text-3xl">Signup</CardTitle>
                    <CardDescription>
                        Create a new account to get started.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleFormSubmit(handleSubmit)}>
                        <FieldGroup className="gap-6">
                            {/* Name */}
                            <Field className="gap-2">
                                <FieldLabel htmlFor="name">Name</FieldLabel>
                                <Input
                                    {...register("name")}
                                    id="name"
                                    type="text"
                                    required
                                />

                                {errors.name && (
                                    <FieldError>
                                        {errors.name.message}
                                    </FieldError>
                                )}
                            </Field>

                            {/* Email */}
                            <Field className="gap-2">
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    {...register("email")}
                                    id="email"
                                    type="email"
                                    required
                                />

                                {errors.email && (
                                    <FieldError>
                                        {errors.email.message}
                                    </FieldError>
                                )}
                            </Field>

                            {/* Password */}
                            <Field className="gap-2">
                                <div className="flex items-center">
                                    <FieldLabel htmlFor="password">
                                        Password
                                    </FieldLabel>
                                </div>

                                <div className="relative">
                                    <Input
                                        className="pr-10"
                                        {...register("password")}
                                        id="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        required
                                    />

                                    <div
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                setShowPassword(!showPassword);
                                            }
                                        }}
                                        className="absolute right-3 transform top-1/2 -translate-y-1/2"
                                        onClick={() => {
                                            setShowPassword(!showPassword);
                                        }}
                                    >
                                        {showPassword ? (
                                            <EyeIcon className="size-4" />
                                        ) : (
                                            <EyeOffIcon className="size-4" />
                                        )}
                                    </div>
                                </div>

                                {errors.password && (
                                    <FieldError>
                                        {errors.password.message}
                                    </FieldError>
                                )}
                            </Field>

                            <Field>
                                <Button type="submit" disabled={isSigningUp}>
                                    {isSigningUp && (
                                        <LoaderIcon className="animate-spin size-4" />
                                    )}
                                    Signup
                                </Button>

                                <FieldDescription className="text-center">
                                    Already have an account?{" "}
                                    <Link to="/auth/login">Login</Link>
                                </FieldDescription>

                                {errors.root && (
                                    <FieldError>
                                        {errors.root.message}
                                    </FieldError>
                                )}
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
