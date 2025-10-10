import { Button } from "./ui/button";
import { Zap, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-card text-card-foreground mt-auto border-t border-border">
      {/* Main Footer */}
      <div className="py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Zap className="w-8 h-8 text-primary" />
                  <div className="absolute inset-0 animate-pulse bg-primary/20 rounded-full blur-md"></div>
                </div>
                <h3 className="text-xl font-bold text-primary">ChargeHub</h3>
              </div>
              
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('company_description')}
              </p>

              {/* Social Links */}
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Services */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-card-foreground">{t('services')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('locate_fast_charger')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('plans_pricing')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('how_to_charge')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('charging_network')}
                  </a>
                </li>
              </ul>
            </div>

            {/* About */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-card-foreground">{t('about_chargehub')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('about_us')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('careers')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('privacy_policy')}
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {t('terms_conditions')}
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg text-card-foreground">{t('contact_us')}</h4>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground">{t('questions_subscriptions')}</p>
                    <a href="tel:1-866-300-3827" className="text-primary hover:text-primary/80 transition-colors">
                      Call 1-866-300-EVCS (3827)
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="mailto:support@chargehub.com" className="text-primary hover:text-primary/80 transition-colors">
                      support@chargehub.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground">
                      Ho Chi Minh City, Vietnam
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  {t('help_center')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-muted-foreground text-sm">
              © 2024 ChargeHub. {t('all_rights_reserved')}
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                {t('privacy_policy')}
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                {t('terms_service')}
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                {t('cookies')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}