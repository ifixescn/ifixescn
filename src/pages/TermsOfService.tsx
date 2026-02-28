import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageMeta from "@/components/common/PageMeta";
import { Scale, FileText, UserCircle, MessageSquare, Copyright, Ban, AlertTriangle, Shield, Users, Link as LinkIcon, Settings, RefreshCw, Gavel, MessageCircle, Phone, Calendar } from "lucide-react";

export default function TermsOfService() {
  const sections = [
    { icon: FileText, title: "Acceptance of Terms", id: "section-1" },
    { icon: Settings, title: "Description of Service", id: "section-2" },
    { icon: UserCircle, title: "User Accounts", id: "section-3" },
    { icon: MessageSquare, title: "User Content", id: "section-4" },
    { icon: Copyright, title: "Intellectual Property", id: "section-5" },
    { icon: Ban, title: "Prohibited Activities", id: "section-6" },
    { icon: AlertTriangle, title: "Disclaimer of Warranties", id: "section-7" },
    { icon: Shield, title: "Limitation of Liability", id: "section-8" },
    { icon: Users, title: "Indemnification", id: "section-9" },
    { icon: LinkIcon, title: "Third-Party Links", id: "section-10" },
    { icon: Settings, title: "Modifications to Service", id: "section-11" },
    { icon: RefreshCw, title: "Changes to Terms", id: "section-12" },
    { icon: Gavel, title: "Governing Law", id: "section-13" },
    { icon: MessageCircle, title: "Dispute Resolution", id: "section-14" },
    { icon: Phone, title: "Contact Information", id: "section-15" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <PageMeta 
        title="Terms of Service - iFixes"
        description="iFixes Terms of Service - Read our terms and conditions for using our services"
        keywords="terms of service, terms and conditions, user agreement, iFixes"
      />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="container mx-auto max-w-6xl px-4 py-20 relative">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl backdrop-blur-sm border border-primary/20 shadow-lg">
              <Scale className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-center mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-xl text-center text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Please read these terms carefully before using our services. By accessing iFixes, you agree to be bound by these terms.
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
          {/* Section 1: Acceptance of Terms */}
          <Card id="section-1" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                1. Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                By accessing and using iFixes ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </CardContent>
          </Card>

          {/* Section 2: Description of Service */}
          <Card id="section-2" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                2. Description of Service
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                iFixes provides a platform for mobile phone repair professionals, including:
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "Product information and showcase",
                  "Repair tutorials and videos",
                  "Q&A community for repair professionals",
                  "Download resources and tools",
                  "Articles and technical documentation"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: User Accounts */}
          <Card id="section-3" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <UserCircle className="w-6 h-6 text-primary" />
                </div>
                3. User Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-lg">3.1 Account Creation</h3>
                <p className="text-muted-foreground mb-3">
                  To access certain features, you may need to create an account. You agree to:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  {[
                    "Provide accurate and complete information",
                    "Maintain the security of your password",
                    "Notify us immediately of any unauthorized use",
                    "Be responsible for all activities under your account"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-lg">3.2 Account Termination</h3>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate your account if you violate these Terms of Service or engage in fraudulent or illegal activities.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: User Content */}
          <Card id="section-4" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                4. User Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-lg">4.1 Your Responsibilities</h3>
                <p className="text-muted-foreground mb-3">
                  You are solely responsible for the content you post on the Service. You agree not to post content that:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  {[
                    "Violates any laws or regulations",
                    "Infringes on intellectual property rights",
                    "Contains malware or harmful code",
                    "Is defamatory, obscene, or offensive",
                    "Promotes illegal activities",
                    "Contains spam or unauthorized advertising"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-lg">4.2 Content License</h3>
                <p className="text-muted-foreground">
                  By posting content on the Service, you grant iFixes a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your content for the purpose of operating and promoting the Service.
                </p>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-lg">4.3 Content Moderation</h3>
                <p className="text-muted-foreground">
                  We reserve the right to remove any content that violates these Terms of Service or is otherwise objectionable, without prior notice.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Intellectual Property */}
          <Card id="section-5" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Copyright className="w-6 h-6 text-primary" />
                </div>
                5. Intellectual Property
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-lg">5.1 iFixes Property</h3>
                <p className="text-muted-foreground">
                  All content, features, and functionality of the Service, including but not limited to text, graphics, logos, and software, are owned by iFixes or its licensors and are protected by copyright, trademark, and other intellectual property laws.
                </p>
              </div>
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold mb-3 text-lg">5.2 Restrictions</h3>
                <p className="text-muted-foreground mb-3">You may not:</p>
                <ul className="space-y-2 text-muted-foreground">
                  {[
                    "Copy, modify, or distribute our content without permission",
                    "Reverse engineer or decompile the Service",
                    "Remove copyright or proprietary notices",
                    "Use our trademarks without authorization"
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Prohibited Activities */}
          <Card id="section-6" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Ban className="w-6 h-6 text-primary" />
                </div>
                6. Prohibited Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">You agree not to:</p>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  "Use the Service for any illegal purpose",
                  "Attempt to gain unauthorized access",
                  "Interfere with or disrupt the Service",
                  "Collect user information without consent",
                  "Impersonate another person or entity",
                  "Transmit viruses or malicious code",
                  "Engage in automated data collection",
                  "Circumvent security measures"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Disclaimer of Warranties */}
          <Card id="section-7" className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                7. Disclaimer of Warranties
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-4">
                <p className="text-muted-foreground font-medium">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                </p>
              </div>
              <p className="text-muted-foreground mb-3">IFIXES DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:</p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  "Merchantability and fitness for a particular purpose",
                  "Accuracy, reliability, or completeness of content",
                  "Uninterrupted or error-free operation",
                  "Security of data transmission"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Section 8: Limitation of Liability */}
          <Card id="section-8" className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-amber-500/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Shield className="w-6 h-6 text-amber-500" />
                </div>
                8. Limitation of Liability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-muted-foreground font-medium">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IFIXES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
                </p>
              </div>
              <p className="text-muted-foreground mb-3">Including but not limited to:</p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  "Loss of profits or revenue",
                  "Loss of data or information",
                  "Business interruption",
                  "Personal injury or property damage"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground mt-4 font-medium">
                Our total liability shall not exceed the amount you paid to us in the past 12 months, or $100, whichever is greater.
              </p>
            </CardContent>
          </Card>

          {/* Section 9: Indemnification */}
          <Card id="section-9" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                9. Indemnification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <p className="text-muted-foreground">
                You agree to indemnify and hold harmless iFixes, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  "Your use of the Service",
                  "Your violation of these Terms of Service",
                  "Your violation of any rights of another party",
                  "Your content posted on the Service"
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Section 10: Third-Party Links and Services */}
          <Card id="section-10" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <LinkIcon className="w-6 h-6 text-primary" />
                </div>
                10. Third-Party Links and Services
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                The Service may contain links to third-party websites or services. We are not responsible for the content, privacy policies, or practices of third-party sites. Your use of third-party services is at your own risk.
              </p>
            </CardContent>
          </Card>

          {/* Section 11: Modifications to Service */}
          <Card id="section-11" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                11. Modifications to Service
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                We reserve the right to modify, suspend, or discontinue the Service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.
              </p>
            </CardContent>
          </Card>

          {/* Section 12: Changes to Terms */}
          <Card id="section-12" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-primary" />
                </div>
                12. Changes to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                We may update these Terms of Service from time to time. We will notify you of any changes by posting the new Terms of Service on this page and updating the "Last Updated" date. Your continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          {/* Section 13: Governing Law */}
          <Card id="section-13" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Gavel className="w-6 h-6 text-primary" />
                </div>
                13. Governing Law
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                These Terms of Service shall be governed by and construed in accordance with the laws of the People's Republic of China, without regard to its conflict of law provisions.
              </p>
            </CardContent>
          </Card>

          {/* Section 14: Dispute Resolution */}
          <Card id="section-14" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-primary" />
                </div>
                14. Dispute Resolution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Any disputes arising from these Terms of Service shall be resolved through good faith negotiations. If negotiations fail, disputes shall be submitted to arbitration in accordance with applicable laws.
              </p>
            </CardContent>
          </Card>

          {/* Section 15: Contact Information */}
          <Card id="section-15" className="border-l-4 border-l-primary shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                15. Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">legal@ifixes.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                  <LinkIcon className="w-5 h-5 text-primary" />
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
          <h3 className="text-2xl font-bold mb-3">Need Legal Assistance?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            If you have any questions or concerns about our terms of service, our legal team is here to help.
          </p>
          <a
            href="mailto:legal@ifixes.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Phone className="w-5 h-5" />
            Contact Legal Team
          </a>
        </div>
      </div>
    </div>
  );
}
