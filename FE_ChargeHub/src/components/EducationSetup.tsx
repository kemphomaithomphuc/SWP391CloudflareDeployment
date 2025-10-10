import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { ArrowLeft, ArrowRight, GraduationCap, Plus, Trash2, Calendar, BookOpen, Award, FileText } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface EducationSetupProps {
  onNext: () => void;
  onBack: () => void;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  field: string;
  startYear: string;
  endYear: string;
  gpa: string;
  description: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate: string;
  credentialId: string;
}

export default function EducationSetup({ onNext, onBack }: EducationSetupProps) {
  const { t } = useLanguage();
  const [educations, setEducations] = useState<Education[]>([
    {
      id: '1',
      degree: '',
      institution: '',
      field: '',
      startYear: '',
      endYear: '',
      gpa: '',
      description: ''
    }
  ]);

  const [certifications, setCertifications] = useState<Certification[]>([
    {
      id: '1',
      name: '',
      issuer: '',
      date: '',
      expiryDate: '',
      credentialId: ''
    }
  ]);

  const [skills, setSkills] = useState<string[]>(['']);
  const [languages, setLanguages] = useState<string[]>(['']);

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      degree: '',
      institution: '',
      field: '',
      startYear: '',
      endYear: '',
      gpa: '',
      description: ''
    };
    setEducations([...educations, newEducation]);
  };

  const removeEducation = (id: string) => {
    if (educations.length > 1) {
      setEducations(educations.filter(edu => edu.id !== id));
    }
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setEducations(educations.map(edu => 
      edu.id === id ? { ...edu, [field]: value } : edu
    ));
  };

  const addCertification = () => {
    const newCertification: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      date: '',
      expiryDate: '',
      credentialId: ''
    };
    setCertifications([...certifications, newCertification]);
  };

  const removeCertification = (id: string) => {
    if (certifications.length > 1) {
      setCertifications(certifications.filter(cert => cert.id !== id));
    }
  };

  const updateCertification = (id: string, field: keyof Certification, value: string) => {
    setCertifications(certifications.map(cert => 
      cert.id === id ? { ...cert, [field]: value } : cert
    ));
  };

  const addSkill = () => {
    setSkills([...skills, '']);
  };

  const removeSkill = (index: number) => {
    if (skills.length > 1) {
      setSkills(skills.filter((_, i) => i !== index));
    }
  };

  const updateSkill = (index: number, value: string) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  const addLanguage = () => {
    setLanguages([...languages, '']);
  };

  const removeLanguage = (index: number) => {
    if (languages.length > 1) {
      setLanguages(languages.filter((_, i) => i !== index));
    }
  };

  const updateLanguage = (index: number, value: string) => {
    const newLanguages = [...languages];
    newLanguages[index] = value;
    setLanguages(newLanguages);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate at least one education entry has basic info
    const hasValidEducation = educations.some(edu => edu.degree && edu.institution);
    
    if (hasValidEducation) {
      onNext();
    }
  };

  const degreeOptions = [
    'High School Diploma',
    'Associate Degree',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'Doctoral Degree (PhD)',
    'Professional Degree',
    'Certification/Training',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl flex items-center justify-center shadow-xl shadow-secondary/20">
                <GraduationCap className="w-8 h-8 text-secondary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <BookOpen className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t('education_qualifications')}
          </h1>
          <p className="text-muted-foreground">
            {t('complete_education_profile')}
          </p>
        </div>

        <div className="space-y-8">
          {/* Education Section */}
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl shadow-secondary/5 p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5 text-secondary" />
                  <h3 className="text-lg font-semibold text-foreground">{t('education_history')}</h3>
                  <span className="text-destructive">*</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEducation}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('add_education')}</span>
                </Button>
              </div>

              {educations.map((education, index) => (
                <div key={education.id} className="p-6 border border-border/30 rounded-xl bg-muted/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">
                      {t('education')} {index + 1}
                    </h4>
                    {educations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEducation(education.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground/90 font-medium">
                        {t('degree_level')} {index === 0 && <span className="text-destructive">*</span>}
                      </Label>
                      <Select 
                        value={education.degree} 
                        onValueChange={(value) => updateEducation(education.id, 'degree', value)}
                      >
                        <SelectTrigger className="h-12 bg-input-background/50 border-border/60 rounded-xl">
                          <SelectValue placeholder={t('select_degree')} />
                        </SelectTrigger>
                        <SelectContent>
                          {degreeOptions.map((degree) => (
                            <SelectItem key={degree} value={degree}>
                              {t(degree.toLowerCase().replace(/[^a-z0-9]/g, '_'))}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground/90 font-medium">
                        {t('institution')} {index === 0 && <span className="text-destructive">*</span>}
                      </Label>
                      <Input
                        value={education.institution}
                        onChange={(e) => updateEducation(education.id, 'institution', e.target.value)}
                        className="h-12 bg-input-background/50 border-border/60 rounded-xl"
                        placeholder={t('enter_institution')}
                        required={index === 0}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground/90 font-medium">{t('field_of_study')}</Label>
                      <Input
                        value={education.field}
                        onChange={(e) => updateEducation(education.id, 'field', e.target.value)}
                        className="h-12 bg-input-background/50 border-border/60 rounded-xl"
                        placeholder={t('enter_field')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground/90 font-medium">{t('gpa_score')}</Label>
                      <Input
                        value={education.gpa}
                        onChange={(e) => updateEducation(education.id, 'gpa', e.target.value)}
                        className="h-12 bg-input-background/50 border-border/60 rounded-xl"
                        placeholder="3.8/4.0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground/90 font-medium">{t('start_year')}</Label>
                      <Input
                        type="number"
                        min="1950"
                        max="2030"
                        value={education.startYear}
                        onChange={(e) => updateEducation(education.id, 'startYear', e.target.value)}
                        className="h-12 bg-input-background/50 border-border/60 rounded-xl"
                        placeholder="2020"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground/90 font-medium">{t('end_year')}</Label>
                      <Input
                        type="number"
                        min="1950"
                        max="2030"
                        value={education.endYear}
                        onChange={(e) => updateEducation(education.id, 'endYear', e.target.value)}
                        className="h-12 bg-input-background/50 border-border/60 rounded-xl"
                        placeholder="2024"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground/90 font-medium">{t('description')}</Label>
                    <Textarea
                      value={education.description}
                      onChange={(e) => updateEducation(education.id, 'description', e.target.value)}
                      className="min-h-[80px] bg-input-background/50 border-border/60 rounded-xl resize-none"
                      placeholder={t('education_description')}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Certifications Section */}
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl shadow-secondary/5 p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-secondary" />
                  <h3 className="text-lg font-semibold text-foreground">{t('certifications')}</h3>
                  <span className="text-xs text-muted-foreground">({t('optional')})</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCertification}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('add_certification')}</span>
                </Button>
              </div>

              {certifications.map((certification, index) => (
                <div key={certification.id} className="p-6 border border-border/30 rounded-xl bg-muted/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">
                      {t('certification')} {index + 1}
                    </h4>
                    {certifications.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCertification(certification.id)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground/90 font-medium">{t('certification_name')}</Label>
                      <Input
                        value={certification.name}
                        onChange={(e) => updateCertification(certification.id, 'name', e.target.value)}
                        className="h-12 bg-input-background/50 border-border/60 rounded-xl"
                        placeholder={t('enter_certification_name')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground/90 font-medium">{t('issuing_organization')}</Label>
                      <Input
                        value={certification.issuer}
                        onChange={(e) => updateCertification(certification.id, 'issuer', e.target.value)}
                        className="h-12 bg-input-background/50 border-border/60 rounded-xl"
                        placeholder={t('enter_issuer')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground/90 font-medium">{t('issue_date')}</Label>
                      <Input
                        type="date"
                        value={certification.date}
                        onChange={(e) => updateCertification(certification.id, 'date', e.target.value)}
                        className="h-12 bg-input-background/50 border-border/60 rounded-xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-foreground/90 font-medium">{t('expiry_date')}</Label>
                      <Input
                        type="date"
                        value={certification.expiryDate}
                        onChange={(e) => updateCertification(certification.id, 'expiryDate', e.target.value)}
                        className="h-12 bg-input-background/50 border-border/60 rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-foreground/90 font-medium">{t('credential_id')}</Label>
                      <Input
                        value={certification.credentialId}
                        onChange={(e) => updateCertification(certification.id, 'credentialId', e.target.value)}
                        className="h-12 bg-input-background/50 border-border/60 rounded-xl"
                        placeholder={t('enter_credential_id')}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Skills and Languages */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Skills Section */}
            <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl shadow-secondary/5 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-secondary" />
                    <h3 className="text-lg font-semibold text-foreground">{t('technical_skills')}</h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSkill}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {skills.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={skill}
                      onChange={(e) => updateSkill(index, e.target.value)}
                      className="h-10 bg-input-background/50 border-border/60 rounded-lg"
                      placeholder={t('enter_skill')}
                    />
                    {skills.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSkill(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Languages Section */}
            <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl shadow-secondary/5 p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-secondary" />
                    <h3 className="text-lg font-semibold text-foreground">{t('languages')}</h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLanguage}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {languages.map((language, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={language}
                      onChange={(e) => updateLanguage(index, e.target.value)}
                      className="h-10 bg-input-background/50 border-border/60 rounded-lg"
                      placeholder={t('enter_language')}
                    />
                    {languages.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLanguage(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl shadow-secondary/5 p-6">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex items-center justify-center space-x-2 h-12 bg-card/50 border-border/60 hover:bg-accent/50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('back')}</span>
                </Button>
                
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary shadow-lg shadow-secondary/20 text-secondary-foreground flex items-center justify-center space-x-2"
                >
                  <span>{t('complete_staff_registration')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mt-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-2 bg-secondary rounded-full"></div>
            <div className="w-8 h-2 bg-secondary rounded-full"></div>
            <div className="w-8 h-2 bg-secondary rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}