import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendEmailVerification, verifyEmailCode } from "@/db/api";
import { Mail, CheckCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // 从URL参数获取邮箱
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    // 倒计时
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setSendingCode(true);
    try {
      await sendEmailVerification(email);
      toast({
        title: "Success",
        description: "Verification code sent! Please check your email.",
      });
      setCountdown(60); // 60 second countdown
    } catch (error: any) {
      console.error("Failed to send verification code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !code) {
      toast({
        title: "Error",
        description: "Please enter email and verification code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyEmailCode(email, code);
      if (result) {
        setVerified(true);
        toast({
          title: "Success",
          description: "Email verified successfully!",
        });
        
        // Redirect to profile after 3 seconds
        setTimeout(() => {
          navigate("/profile");
        }, 3000);
      } else {
        toast({
          title: "Error",
          description: "Invalid or expired verification code",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Verification failed:", error);
      toast({
        title: "Error",
        description: error.message || "Verification failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Email Verified!</CardTitle>
            <CardDescription>
              Your email has been successfully verified. Redirecting to your profile...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            Enter your email address and the verification code sent to your inbox
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendCode}
                  disabled={sendingCode || countdown > 0}
                >
                  {sendingCode ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : countdown > 0 ? (
                    `${countdown}s`
                  ) : (
                    "Send Code"
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend verification code"}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to Profile
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
