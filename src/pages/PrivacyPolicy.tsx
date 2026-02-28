import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageMeta from "@/components/common/PageMeta";
import { Shield, Lock, Eye, Users, Globe, FileText, Mail, Calendar, Database, Share2, Cookie, UserCheck, Baby, Plane, RefreshCw, Phone } from "lucide-react";

export default function PrivacyPolicy() {
  const sections = [
    { icon: Eye, title: "Information We Collect", id: "section-1" },
    { icon: Database, title: "How We Use Your Information", id: "section-2" },
    { icon: Share2, title: "Information Sharing", id: "section-3" },
    { icon: Lock, title: "Data Security", id: "section-4" },
    { icon: Cookie, title: "Cookies & Tracking", id: "section-5" },
    { icon: UserCheck, title: "Your Rights", id: "section-6" },
    { icon: Baby, title: "Children's Privacy", id: "section-7" },
    { icon: Plane, title: "International Transfers", id: "section-8" },
    { icon: RefreshCw, title: "Policy Changes", id: "section-9" },
    { icon: Phone, title: "Contact Us", id: "section-10" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <PageMeta 
        title="Privacy Policy - iFixes"
        description="iFixes Privacy Policy - Learn how we collect, use, and protect your personal information"
        keywords="privacy policy, data protection, user privacy, iFixes"
      />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container mx-auto max-w-6xl px-4 py-20 relative">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl backdrop-blur-sm border border-primary/20 shadow-lg">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information.
          </p>
          <div className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Last Updated: January 7, 2025</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-16">
        {/* Quick Navigation */}
        <div className="mb-12 p-6 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Quick Navigation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <a
                  key={index}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-primary/5 group"
                >
                  <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span>{index + 1}. {section.title}</span>
                </a>
              );
            })}
          </div>
        </div>
        
        <div className="space-y-8">
          {/* Section 1: Information We Collect */}
          <Card id="section-1" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Eye className="w-6 h-6 text-primary" />
                </div>
                1. Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-lg">1.1 Information You Provide</h3>
                <p className="text-muted-foreground mb-3">
                  We collect information that you voluntarily provide to us when you:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Register for an account</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Post questions or answers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Contact us for support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Subscribe to our newsletter</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-lg">1.2 Automatically Collected Information</h3>
                <p className="text-muted-foreground mb-3">
                  When you visit our website, we automatically collect certain information about your device, including:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>IP address</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Browser type and version</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Operating system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Pages visited and time spent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Referring website</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: How We Use Your Information */}
          <Card id="section-2" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Database className="w-6 h-6 text-primary" />
                </div>
                2. How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                We use the information we collect to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  "Provide, maintain, and improve our services",
                  "Process your requests and transactions",
                  "Send you technical notices and support messages",
                  "Respond to your comments and questions",
                  "Analyze usage patterns and trends",
                  "Detect and prevent fraud and abuse",
                  "Comply with legal obligations"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Section 3: Information Sharing and Disclosure */}
          <Card id="section-3" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Share2 className="w-6 h-6 text-primary" />
                </div>
                3. Information Sharing and Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">With your consent:</strong> When you explicitly agree to share information
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Service providers:</strong> With trusted third-party service providers who assist us in operating our website
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Legal requirements:</strong> When required by law or to protect our rights
                  </p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Business transfers:</strong> In connection with a merger, acquisition, or sale of assets
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Data Security */}
          <Card id="section-4" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                4. Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal information, including:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  "Encryption of data in transit and at rest",
                  "Regular security assessments",
                  "Access controls and authentication",
                  "Secure data storage with Supabase"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> However, no method of transmission over the Internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Cookies and Tracking Technologies */}
          <Card id="section-5" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
                5. Cookies and Tracking Technologies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  "Remember your preferences",
                  "Understand how you use our website",
                  "Improve your user experience",
                  "Analyze website traffic"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-4">
                You can control cookies through your browser settings. However, disabling cookies may affect the functionality of our website.
              </p>
            </CardContent>
          </Card>

          {/* Section 6: Your Rights */}
          <Card id="section-6" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserCheck className="w-6 h-6 text-primary" />
                </div>
                6. Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                You have the following rights regarding your personal information:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: "Access", desc: "Request a copy of your personal information" },
                  { title: "Correction", desc: "Request correction of inaccurate information" },
                  { title: "Deletion", desc: "Request deletion of your personal information" },
                  { title: "Objection", desc: "Object to processing of your information" },
                  { title: "Portability", desc: "Request transfer of your information" },
                  { title: "Withdraw consent", desc: "Withdraw consent at any time" }
                ].map((right, index) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-1">{right.title}</h4>
                    <p className="text-sm text-muted-foreground">{right.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-4">
                To exercise these rights, please contact us at the email address provided below.
              </p>
            </CardContent>
          </Card>

          {/* Section 7: Children's Privacy */}
          <Card id="section-7" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Baby className="w-6 h-6 text-primary" />
                </div>
                7. Children's Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </CardContent>
          </Card>

          {/* Section 8: International Data Transfers */}
          <Card id="section-8" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plane className="w-6 h-6 text-primary" />
                </div>
                8. International Data Transfers
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using our services, you consent to the transfer of your information to these countries.
              </p>
            </CardContent>
          </Card>

          {/* Section 9: Changes to This Privacy Policy */}
          <Card id="section-9" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-primary" />
                </div>
                9. Changes to This Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </CardContent>
          </Card>

          {/* Section 10: Contact Us */}
          <Card id="section-10" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                10. Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">privacy@ifixes.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Website</p>
                    <p className="font-medium">www.ifixes.com</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border text-center">
          <h3 className="text-2xl font-bold mb-3">Have Questions?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            If you have any questions or concerns about our privacy practices, we're here to help.
          </p>
          <a
            href="mailto:privacy@ifixes.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Mail className="w-5 h-5" />
            Contact Privacy Team
          </a>
        </div>
      </div>
    </div>
  );
}
