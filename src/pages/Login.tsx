import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/db/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogIn, UserPlus, Lock, User, Eye, EyeOff, Sparkles, Shield, Zap, Mail } from "lucide-react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = (location.state as { from?: string })?.from || "/";

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const usernameOrEmail = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!usernameOrEmail || !password) {
      toast({
        title: "Error",
        description: "Please enter username/email and password",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Check if it's email or username
    let email = usernameOrEmail;
    let isUsername = false;
    
    if (!usernameOrEmail.includes("@")) {
      // If no @, it's a username, convert to email format
      if (!/^[a-zA-Z0-9_]+$/.test(usernameOrEmail)) {
        toast({
          title: "Error",
          description: "Username can only contain letters, numbers and underscores",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      isUsername = true;
      
      // First, try to get the real email from profiles table
      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", usernameOrEmail)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching user email from profiles:", profileError);
        }

        if (!profileError && profileData?.email) {
          email = profileData.email;
          isUsername = false; // Found real email, no need for fallback
          console.log("Found email from profiles table:", email);
        } else {
          console.log("No email found in profiles table for username:", usernameOrEmail);
        }
      } catch (error) {
        console.error("Exception fetching user email:", error);
      }

      // If we couldn't find the real email, use domain conversion
      if (isUsername) {
        email = `${usernameOrEmail}@ifixescn.com`;
        console.log("Using domain conversion:", email);
      }
    } else {
      // Validate email format
      if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(usernameOrEmail)) {
        toast({
          title: "Error",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    try {
      // Try to login with the primary email domain
      console.log("Attempting login with email:", email);
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If login failed with @ifixescn.com and it's a username, try @miaoda.com
      if (error && isUsername) {
        console.log("Primary login failed, trying fallback domain");
        const fallbackEmail = `${usernameOrEmail}@miaoda.com`;
        console.log("Attempting login with fallback email:", fallbackEmail);
        const fallbackResult = await supabase.auth.signInWithPassword({
          email: fallbackEmail,
          password,
        });
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) throw error;

      if (!data.user) {
        throw new Error("Login failed, no user data returned");
      }

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      navigate(from, { replace: true });
    } catch (error: unknown) {
      console.error("Login failed:", error);
      let errorMessage = "Invalid username/email or password";
      
      if (error instanceof Error) {
        if (error.message.includes("Invalid login credentials") || error.message.includes("invalid")) {
          errorMessage = "Invalid username/email or password, please try again";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Email not verified, please verify your email first";
        } else if (error.message.includes("too many requests")) {
          errorMessage = "Too many login attempts, please try again later";
        } else if (error.message.includes("network")) {
          errorMessage = "Network connection failed, please check your network";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm-password") as string;

    if (!username || !email || !password || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast({
        title: "Error",
        description: "Username can only contain letters, numbers and underscores",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Validate email format
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            email: email,
          },
          emailRedirectTo: undefined, // Disable email confirmation
        }
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Registration failed, no user data returned");
      }

      toast({
        title: "Registration Successful",
        description: "Welcome! Redirecting...",
      });

      await new Promise(resolve => setTimeout(resolve, 1000));

      navigate(from, { replace: true });
    } catch (error: unknown) {
      console.error("Registration failed:", error);
      let errorMessage = "Registration failed, please try again later";
      
      if (error instanceof Error) {
        if (error.message.includes("already registered") || error.message.includes("User already registered")) {
          errorMessage = "This email is already registered, please use another email";
        } else if (error.message.includes("23505") || error.message.includes("duplicate key")) {
          if (error.message.includes("username")) {
            errorMessage = "This username already exists, please use another username";
          } else {
            errorMessage = "This email is already registered, please use another email";
          }
        } else if (error.message.includes("email")) {
          errorMessage = "Invalid email format or already in use";
        } else if (error.message.includes("weak password")) {
          errorMessage = "Password is too weak, please use a stronger password";
        } else if (error.message.includes("invalid")) {
          errorMessage = "Invalid input, please check and try again";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-background">
      {/* Left display area - Desktop view */}
      <div className="hidden xl:flex xl:w-1/2 relative bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
        {/* Dynamic background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute -bottom-32 left-1/3 w-72 h-72 bg-primary/25 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Content area */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="max-w-md space-y-8">
            {/* Logo area */}
            <div className="space-y-4">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/50">
                <Sparkles className="w-10 h-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl font-bold gradient-text">iFixes Official Platform</h1>
              <p className="text-lg text-muted-foreground">Log in to obtain more technical information and interact with iFixes online for communication</p>
            </div>

            {/* Features list */}
            <div className="space-y-6 pt-8">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Technical exchange</h3>
                  <p className="text-sm text-muted-foreground">Online interactive communication technology issues</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Quick response</h3>
                  <p className="text-sm text-muted-foreground">Quickly respond to problems encountered during product use</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Star-rated Service</h3>
                  <p className="text-sm text-muted-foreground">Provide high-quality star rated services to members</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Right form area */}
      <div className="flex-1 flex items-center justify-center p-4 xl:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="xl:hidden text-center space-y-2">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/50 mx-auto">
              <Sparkles className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">iFixes</h1>
          </div>

          {/* Form card */}
          <div className="bg-card border border-border rounded-2xl shadow-xl p-8 space-y-6">
            {/* Tab toggle */}
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  isLogin
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Login
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  !isLogin
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Register
                </span>
              </button>
            </div>

            {/* Login form */}
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username or Email
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="username"
                      name="username"
                      placeholder="Enter username or email"
                      className="pl-10 h-12"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-12"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
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
                      Logging in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              /* Register form */
              (<form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="reg-username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="reg-username"
                      name="username"
                      placeholder="Enter username"
                      className="pl-10 h-12"
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only letters, numbers and underscores allowed
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      name="email"
                      type="email"
                      placeholder="Enter email address"
                      className="pl-10 h-12"
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Verify your email to upgrade to Silver member
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password (at least 6 characters)"
                      className="pl-10 pr-10 h-12"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Enter password again"
                      className="pl-10 pr-10 h-12"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
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
                      Registering...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </span>
                  )}
                </Button>
              </form>)
            )}
          </div>

          {/* Bottom notice */}
          <p className="text-center text-sm text-muted-foreground">
            By signing in, you agree to our
            <Link 
              to="/terms" 
              className="text-primary hover:underline cursor-pointer mx-1"
            >
              Terms of Service
            </Link>
            and
            <Link 
              to="/privacy" 
              className="text-primary hover:underline cursor-pointer ml-1"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
