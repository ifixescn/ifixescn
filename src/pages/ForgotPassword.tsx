import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/db/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // 验证邮箱格式
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: "Email sent successfully",
        description: "Please check your email for password reset instructions",
      });
    } catch (error: unknown) {
      console.error("Password reset failed:", error);
      let errorMessage = "Failed to send reset email, please try again";
      
      if (error instanceof Error) {
        if (error.message.includes("rate limit")) {
          errorMessage = "Too many requests, please try again later";
        } else if (error.message.includes("network")) {
          errorMessage = "Network connection failed, please check your network";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => navigate("/login")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Button>

        {/* 表单卡片 */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
          {!emailSent ? (
            <>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Forgot Password</h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email address and we'll send you instructions to reset your password
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-10 h-12"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">Check Your Email</h2>
              <p className="text-sm text-muted-foreground">
                We've sent password reset instructions to your email address. 
                Please check your inbox and follow the link to reset your password.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
