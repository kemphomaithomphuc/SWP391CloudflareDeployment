import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Zap, ArrowLeft, MapPin, Phone, Mail } from "lucide-react";

interface PersonalInfoProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function PersonalInfo({ onComplete, onBack }: PersonalInfoProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Main Card Container */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-2xl shadow-primary/5 p-8 space-y-8">
          {/* Back Button */}
          <div className="flex justify-start -mt-2">
            <button 
              onClick={onBack}
              className="flex items-center space-x-1.5 text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-300 p-1 -ml-1 text-sm opacity-75 hover:opacity-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>

          {/* Logo/WebName */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative group">
                {/* Outer glow rings */}
                <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent animate-pulse"></div>
                <div className="absolute -inset-6 rounded-full bg-gradient-to-r from-primary/15 via-primary/8 to-transparent animate-pulse" style={{animationDelay: '0.5s'}}></div>
                
                {/* Main logo container */}
                <div className="relative">
                  {/* Background geometric pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/70 rounded-3xl transform rotate-6 scale-110 opacity-20"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-secondary via-accent to-primary/30 rounded-3xl transform -rotate-3 scale-105 opacity-15"></div>
                  
                  {/* Main logo */}
                  <div className="relative w-20 h-20 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 transform rotate-12 group-hover:rotate-0 transition-all duration-500 border-2 border-primary/20">
                    {/* Inner glow */}
                    <div className="absolute inset-2 bg-gradient-to-br from-primary-foreground/20 to-transparent rounded-2xl"></div>
                    
                    {/* Lightning bolt with extra styling */}
                    <div className="relative">
                      <Zap className="w-10 h-10 text-primary-foreground filter drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 w-10 h-10">
                        <Zap className="w-10 h-10 text-primary-foreground/30 blur-sm" />
                      </div>
                    </div>
                    
                    {/* Corner accents */}
                    <div className="absolute top-1 right-1 w-2 h-2 bg-primary-foreground/40 rounded-full"></div>
                    <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-primary-foreground/30 rounded-full"></div>
                  </div>
                  
                  {/* Floating particles */}
                  <div className="absolute -top-2 -right-2 w-1 h-1 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="absolute -bottom-1 -left-2 w-0.5 h-0.5 bg-accent-foreground rounded-full animate-bounce" style={{animationDelay: '0.8s'}}></div>
                  <div className="absolute top-1/2 -right-4 w-0.5 h-0.5 bg-primary/60 rounded-full animate-pulse"></div>
                </div>
                
                {/* Energy rays */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-gradient-to-t from-primary/40 to-transparent transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute bottom-0 left-1/2 w-0.5 h-6 bg-gradient-to-b from-primary/40 to-transparent transform -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{transitionDelay: '0.1s'}}></div>
                  <div className="absolute left-0 top-1/2 h-0.5 w-6 bg-gradient-to-l from-primary/40 to-transparent transform -translate-y-1/2 -translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{transitionDelay: '0.2s'}}></div>
                  <div className="absolute right-0 top-1/2 h-0.5 w-8 bg-gradient-to-r from-primary/40 to-transparent transform -translate-y-1/2 translate-x-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{transitionDelay: '0.3s'}}></div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-foreground tracking-tight bg-gradient-to-r from-foreground via-primary/80 to-foreground bg-clip-text">
                ChargeHub
              </h1>
              <div className="relative">
                <p className="text-muted-foreground/90 font-medium">Complete your charging profile</p>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
              </div>
            </div>
          </div>

          {/* Personal Info Form */}
          <div className="space-y-6">
            <div className="space-y-1 mb-6">
              <h2 className="text-lg font-semibold text-foreground">Personal Information</h2>
              <p className="text-sm text-muted-foreground/80">Help us personalize your charging experience</p>
            </div>

            <div className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/90 font-medium flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-primary/70" />
                  <span>Email Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Phone Number Field */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-foreground/90 font-medium flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-primary/70" />
                  <span>Phone Number</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Address Section */}
              <div className="space-y-4">
                <Label className="text-foreground/90 font-medium flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-primary/70" />
                  <span>Address</span>
                </Label>
                
                <div className="space-y-3">
                  <Input
                    id="street"
                    type="text"
                    placeholder="Street Address"
                    className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                  />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      id="city"
                      type="text"
                      placeholder="City"
                      className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                    />
                    <Input
                      id="state"
                      type="text"
                      placeholder="State"
                      className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      id="zip"
                      type="text"
                      placeholder="ZIP Code"
                      className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60"
                    />
                    <Input
                      id="country"
                      type="text"
                      placeholder="Country"
                      className="h-12 bg-input-background/50 border-border/60 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/60 col-span-2"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button 
                onClick={onComplete}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5" 
                type="submit"
              >
                Complete Setup
              </Button>
              
              <Button 
                variant="outline"
                onClick={onComplete}
                className="w-full h-12 bg-card/50 border-border/60 hover:bg-accent/50 hover:border-border rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 text-muted-foreground hover:text-foreground"
              >
                Skip for Now
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mt-6">
          <div className="w-2 h-2 bg-primary/40 rounded-full"></div>
          <div className="w-2 h-2 bg-primary/40 rounded-full"></div>
          <div className="w-6 h-2 bg-primary rounded-full"></div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground/50 text-sm">
            Secure • Fast • Reliable EV Charging
          </p>
        </div>
      </div>
    </div>
  );
}