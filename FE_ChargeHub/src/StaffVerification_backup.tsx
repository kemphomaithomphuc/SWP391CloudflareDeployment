import { useState } from "react";
import { useTheme } from "./contexts/ThemeContext";
import { useLanguage } from "./contexts/LanguageContext";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { ArrowLeft, Sun, Moon, Globe, CheckCircle } from "lucide-react";

interface StaffVerificationProps {
  onNext: () => void;
  onBack: () => void;
}

export default function StaffVerification({ onNext, onBack }: StaffVerificationProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  
  const [formData, setFormData] = useState({
    certification: "",
    college: "",
    gpa: "",
    companyKnowledge: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would validate and submit to backend
    onNext();
  };

  const isFormValid = formData.certification && formData.college && formData.companyKnowledge;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="font-bold text-primary-foreground">C</span>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">ChargeHub</h1>
                  <p className="text-sm text-muted-foreground">Staff Portal</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLanguage(language === "en" ? "vi" : "en")}
                className="text-muted-foreground hover:text-foreground"
              >
                <Globe className="w-4 h-4 mr-2" />
                {language === "en" ? "VI" : "EN"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="w-16 h-1 bg-primary rounded-full"></div>
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-foreground">2</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Step 2 of 2: Technical & Knowledge Verification
            </p>
          </div>

          {/* Verification Form */}
          <div className="bg-card rounded-xl p-8 shadow-sm border border-border">
            <div className="mb-8">
              <h2 className="mb-2 text-foreground">Tech & Know Verification</h2>
              <div className="w-full h-1 bg-primary rounded-full mb-6"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Certification */}
              <div className="space-y-2">
                <label className="text-card-foreground">
                  Certification
                </label>
                <Input
                  type="text"
                  value={formData.certification}
                  onChange={(e) => handleInputChange("certification", e.target.value)}
                  placeholder="Enter your relevant certifications"
                  className="bg-input-background border-border"
                  required
                />
              </div>

              {/* College */}
              <div className="space-y-2">
                <label className="text-card-foreground">
                  College
                </label>
                <Input
                  type="text"
                  value={formData.college}
                  onChange={(e) => handleInputChange("college", e.target.value)}
                  placeholder="Enter your college/university"
                  className="bg-input-background border-border"
                  required
                />
              </div>

              {/* GPA */}
              <div className="space-y-2">
                <label className="text-card-foreground">
                  GPA if you are studying
                </label>
                <Input
                  type="text"
                  value={formData.gpa}
                  onChange={(e) => handleInputChange("gpa", e.target.value)}
                  placeholder="Enter your GPA (optional)"
                  className="bg-input-background border-border"
                />
              </div>

              {/* Company Knowledge */}
              <div className="space-y-2">
                <label className="text-card-foreground">
                  What do you know about this company?
                </label>
                <Textarea
                  value={formData.companyKnowledge}
                  onChange={(e) => handleInputChange("companyKnowledge", e.target.value)}
                  placeholder="Describe what you know about ChargeHub and why you want to work here..."
                  className="bg-input-background border-border min-h-[120px] resize-none"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={!isFormValid}
                >
                  Complete Verification
                </Button>
              </div>
            </form>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              All information will be reviewed by our HR team within 24-48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}