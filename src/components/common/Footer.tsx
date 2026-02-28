import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSiteSetting } from "@/db/api";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

interface FooterLink {
  name: string;
  url: string;
}

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [companyName, setCompanyName] = useState("iFixes");
  const [copyrightText, setCopyrightText] = useState("iFixes");
  const [aboutUs, setAboutUs] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [businessHours, setBusinessHours] = useState("");
  const [icpNumber, setIcpNumber] = useState("");
  const [policeNumber, setPoliceNumber] = useState("");
  const [footerLinks, setFooterLinks] = useState<FooterLink[]>([]);

  useEffect(() => {
    loadFooterSettings();

    // Listen to settings update event
    const handleSettingsUpdate = () => {
      loadFooterSettings();
    };

    window.addEventListener("settingsUpdated", handleSettingsUpdate);

    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
    };
  }, []);

  const loadFooterSettings = async () => {
    try {
      const [
        companyNameSetting,
        copyrightSetting,
        aboutUsSetting,
        addressSetting,
        phoneSetting,
        emailSetting,
        hoursSetting,
        icpSetting,
        policeSetting,
        linksSetting,
      ] = await Promise.all([
        getSiteSetting("company_name"),
        getSiteSetting("copyright_text"),
        getSiteSetting("about_us"),
        getSiteSetting("contact_address"),
        getSiteSetting("contact_phone"),
        getSiteSetting("contact_email"),
        getSiteSetting("business_hours"),
        getSiteSetting("icp_number"),
        getSiteSetting("police_number"),
        getSiteSetting("footer_links"),
      ]);

      if (companyNameSetting?.value) setCompanyName(companyNameSetting.value);
      if (copyrightSetting?.value) setCopyrightText(copyrightSetting.value);
      if (aboutUsSetting?.value) setAboutUs(aboutUsSetting.value);
      if (addressSetting?.value) setContactAddress(addressSetting.value);
      if (phoneSetting?.value) setContactPhone(phoneSetting.value);
      if (emailSetting?.value) setContactEmail(emailSetting.value);
      if (hoursSetting?.value) setBusinessHours(hoursSetting.value);
      if (icpSetting?.value) setIcpNumber(icpSetting.value);
      if (policeSetting?.value) setPoliceNumber(policeSetting.value);
      if (linksSetting?.value) {
        try {
          const links = JSON.parse(linksSetting.value);
          setFooterLinks(Array.isArray(links) ? links : []);
        } catch (e) {
          console.error("Failed to parse footer URL:", e);
        }
      }
    } catch (error) {
      console.error("Failed to load footer settings:", error);
    }
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Us */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About Us</h3>
            {aboutUs ? (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {aboutUs}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                {companyName}
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              {contactAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{contactAddress}</span>
                </div>
              )}
              {contactPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{contactPhone}</span>
                </div>
              )}
              {contactEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <a
                    href={`mailto:${contactEmail}`}
                    className="hover:text-primary transition-colors"
                  >
                    {contactEmail}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              {businessHours && (
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{businessHours}</span>
                </div>
              )}
              {footerLinks.length > 0 && (
                <div className="mt-4 space-y-2">
                  {footerLinks.map((link, index) => (
                    <div key={index}>
                      {link.url.startsWith("http") ? (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          {link.name}
                        </a>
                      ) : (
                        <Link
                          to={link.url}
                          className="hover:text-primary transition-colors"
                        >
                          {link.name}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="text-center md:text-left">
              <p>© {currentYear} {copyrightText}</p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end gap-4">
              <Link
                to="/privacy"
                className="hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <span>|</span>
              <Link
                to="/terms"
                className="hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              {(icpNumber || policeNumber) && <span>|</span>}
              {icpNumber && (
                <a
                  href="https://beian.miit.gov.cn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  {icpNumber}
                </a>
              )}
              {policeNumber && (
                <a
                  href="http://www.beian.gov.cn/portal/registerSystemInfo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-1"
                >
                  <img 
                    src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAGGSURBVHgBjZLNSsNAFIXPTZq0/kGpYkEQXLhw4UYXbty58QV8AV/Ahbj0BXwCn8CFG1eCCxcuXLhQEKS1WtE/bJM0mUzuTdJYK9aDH5nJzD1z7jkzBP4RQggopTBNE4ZhQNd1aJoGVVWhaRo0TYOqqtB1HaqqQlVVGIYBXdeh6zp0XYeu69B1HYZhQNM0aJoGVVWhaRpUVYWmaVBVFZqmQVVVqKoKVVWhaRpUVYWqqtA0DaqqQlVVqKoKVVWhaRpUVYWqqtA0DaqqQlVVqKoKVVWhaRpUVYWqqtA0DaqqQlVVqKoKVVWhaRpUVYWqqtA0DaqqQlVVqKoKVVWhaRpUVYWqqtA0DaqqQlVVqKoKVVWhaRpUVYWqqtA0DaqqQlVVqKoKVVWhaRpUVYWqqtA0DaqqQlVVqKoKVVWhaRpUVYWqqtA0DaqqQlVVqKoKVVWhaRpUVYWqqtA0DaqqQlVVqKoKVVWhaRpUVYWqqtA0DaqqQlVVqKoKVVWhaRpUVYWqqtA0DaqqQlVVqKoKVVWhaRr+AH8BvQHmXwPfAAAAAElFTkSuQmCC" 
                    alt="公安备案图标"
                    className="h-3.5 w-3.5"
                  />
                  {policeNumber}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
