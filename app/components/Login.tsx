import image_a7e321551d78150f830b1e4870452ab5d2dd7d7e from "../assets/uwc-berhad-logo.png";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { toast } from "sonner";
import { apiFetch, type AuthUser } from "../lib/api";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        const data = await apiFetch<{ user: AuthUser }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });

        localStorage.setItem("hr_authenticated", "true");
        localStorage.setItem("hr_user", data.user.email);
        localStorage.setItem("hr_user_data", JSON.stringify(data.user));

        toast.success(`Welcome, ${data.user.name}`);
        navigate("/dashboard");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Login failed");
      }
    } else {
      toast.error("Please fix the errors in the form");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="space-y-4 text-center">
          <img src={image_a7e321551d78150f830b1e4870452ab5d2dd7d7e} alt="UWC Logo" className="mx-auto h-16 w-auto" />
          <CardTitle className="text-2xl">HR Recruitment System</CardTitle>
          <CardDescription>
            Sign in to access your dashboard and manage candidates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="hr@uwc.com.my"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-[#003B7A] hover:bg-[#002f63] text-white shadow-sm">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
