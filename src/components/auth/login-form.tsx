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
import z from "zod";
import { AxiosError } from "axios";
import { useForm, type SubmitHandler } from "react-hook-form";
import api from "@/app/api";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { EyeIcon, EyeOffIcon, LoaderIcon } from "lucide-react";
import { login } from "@/app/features/auth.slice";
import { useAppDispatch } from "@/app/hooks";

const loginFormSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.any(),
    // .string()
    // .min(8, "Password must be at least 8 characters long")
    // .max(64, "Password must be at most 64 characters long"),
});
type LoginFormData = z.infer<typeof loginFormSchema>;

export default function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit: handleFormSubmit,
        formState: { errors },
        setError,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginFormSchema),
    });

    const dispatch = useAppDispatch();

    const { mutateAsync: loginUser, isPending: isLoggingIn } = useMutation({
        mutationFn: async (data: { email: string; password: string }) => {
            return api.post("/auth/login", data, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
        },
    });

    const handleSubmit: SubmitHandler<LoginFormData> = async (data) => {
        try {
            const response = await loginUser(data);

            if (response.status !== 200) {
                throw new Error();
            }

            const accessToken = response.data.accessToken;
            dispatch(login({ accessToken, userInfo: response.data.user }));
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data) {
                const errorCode = err.response.data.errorCode;

                if (errorCode === "INVALID_PAYLOAD") {
                    const errors = err.response.data.errors;

                    for (const error of errors) {
                        setError(error.field, {
                            message: error.error,
                        });
                    }
                } else if (errorCode === "INVALID_CREDENTIALS") {
                    setError("root", {
                        message: "Invalid email or password.",
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
                    <CardTitle className="text-3xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleFormSubmit(handleSubmit)}>
                        <FieldGroup>
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
                                <FieldLabel htmlFor="password">
                                    Password
                                </FieldLabel>

                                <div className="relative">
                                    <Input
                                        className="pr-10"
                                        id="password"
                                        {...register("password")}
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
                                <Button type="submit" disabled={isLoggingIn}>
                                    {isLoggingIn && (
                                        <LoaderIcon className="animate-spin size-4" />
                                    )}
                                    Login
                                </Button>

                                {errors.root && (
                                    <FieldError>
                                        {errors.root.message}
                                    </FieldError>
                                )}

                                <FieldDescription className="text-center">
                                    Don&apos;t have an account?{" "}
                                    <Link to="/auth/signup">Sign up</Link>
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
