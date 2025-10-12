import React, { useState, useEffect } from "react";
import axios from "axios";
import { User, Edit, Save, ArrowLeft, Key, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useLanguage } from "../contexts/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";

interface ProfileViewProps {
    onBack: () => void;
}

interface UserProfile {
    userId: number;
    fullName: string;
    email: string;
    phone: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    role: string;
    address: string | null;
    status: string;
}

export default function ProfileView({ onBack }: ProfileViewProps) {
    const { t } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState<UserProfile>({
        userId: 0,
        fullName: "",
        email: "",
        phone: null,
        dateOfBirth: null,
        gender: null,
        role: localStorage.getItem("role") || "DRIVER",
        address: null,
        status: "ACTIVE",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // For password change
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

    const userId = localStorage.getItem("userId");  //từ login
    const token = localStorage.getItem("token");
    const emailFallback = localStorage.getItem("email") || "";  // Từ decoded sub

    useEffect(() => {
        const fetchProfile = async () => {
            if (!userId || !token) {
                setError("Missing userId or token from login");
                return;
            }
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`http://localhost:8080/api/user/profile/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                // Nested response.data.data hoặc data
                const profile = response.data.data || response.data;
                setProfileData(profile);
                console.log("Profile fetched:", profile);
            } catch (err: any) {
                console.error("Fetch profile error:", err);
                if (err.response?.status === 405 || err.response?.status === 400) {
                    setError("Endpoint mismatch (405/400). Check BE mapping for /api/user/profile/{id}. Fallback to local data.");
                } else if (err.response?.status === 404) {
                    setError("Profile not found for ID " + userId + ". Check user ID.");
                } else {
                    setError(t("Failed to load Profile") + ": " + (err.response?.data?.message || err.message));
                }
                // Fallback UI data từ localStorage/email
                setProfileData({
                    userId: parseInt(userId) || 0,
                    fullName: localStorage.getItem("fullName") || emailFallback,
                    email: emailFallback,
                    phone: localStorage.getItem("phone") || null,
                    dateOfBirth: null,
                    gender: null,
                    role: localStorage.getItem("role") || "DRIVER",
                    address: null,
                    status: "ACTIVE",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [t, userId, token, emailFallback]);

    const handleRetryFetch = () => {
        setError(null);
        window.location.reload();  // Simple retry
    };

    const handleSave = async () => {
        if (!userId || !token) {
            setError("Missing user ID or token");
            return;
        }
        try {
            setLoading(true);
            setError(null);
            console.log("Saving with userId:", userId);  // Debug ID used
            // Path param numeric userId cho PUT
            const response = await axios.put(`http://localhost:8080/api/user/profile/${userId}`, profileData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            // Update localStorage
            localStorage.setItem("fullName", profileData.fullName);
            localStorage.setItem("phone", profileData.phone || "");
            setIsEditing(false);
            console.log("Save success:", response.data);
        } catch (err: any) {
            console.error("Save error:", err);
            setError(t("Failed to save Profile") + ": " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof UserProfile, value: string) => {
        setProfileData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle password change
    const handleChangePassword = async () => {
        if (!userId || !token) {
            setPasswordError("Missing user ID or token");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("New password and confirm password do not match.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            return;
        }
        try {
            setPasswordError(null);
            setPasswordSuccess(null);
            // Path param numeric userId cho PUT password
            const response = await axios.put(
                `http://localhost:8080/api/user/profile/password/${userId}`,
                { oldPassword, newPassword, confirmNewPassword: confirmPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPasswordSuccess("Password changed successfully.");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setIsPasswordDialogOpen(false), 1500);
            console.log("Password change success:", response.data);
        } catch (err: any) {
            console.error("Password change error:", err);
            setPasswordError("Failed to change password: " + (err.response?.data?.message || err.message));
        }
    };

    if (loading && Object.values(profileData).every(v => v === "" || v === 0 || v === null)) return <p>{t("loading")}...</p>;
    if (error && !profileData.userId && !profileData.fullName) return (
        <div className="p-6">
            <p style={{ color: "red" }}>{error}</p>
            <Button onClick={handleRetryFetch} className="mt-2 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Retry Fetch</span>
            </Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onBack}
                            className="flex items-center space-x-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>{t('Back to Dashboard')}</span>
                        </Button>
                        <h1 className="text-2xl font-semibold text-foreground">{t('user_profile')}</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            disabled={loading}
                            className="flex items-center space-x-2"
                        >
                            {isEditing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                            <span>{isEditing ? t('Save Changes') : t('Edit Profile')}</span>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsPasswordDialogOpen(true)}
                            className="flex items-center space-x-2"
                        >
                            <Key className="w-4 h-4" />
                            <span>{t("Change Password")}</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="text-center">
                            <Avatar className="w-24 h-24 mx-auto mb-4">
                                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                                    {profileData.fullName.charAt(0).toUpperCase() || emailFallback.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <CardTitle>{profileData.fullName || emailFallback}</CardTitle>
                            <p className="text-muted-foreground">{profileData.email || emailFallback}</p>
                        </CardHeader>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <User className="w-5 h-5" />
                                <span>{t('Personal Information')}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">{t('full_name')}</Label>
                                    {isEditing ? (
                                        <Input
                                            id="fullName"
                                            value={profileData.fullName || ''}
                                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                                            required
                                        />
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.fullName || "Not set"}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">{t('email')}</Label>
                                    {isEditing ? (
                                        <Input
                                            id="email"
                                            type="email"
                                            value={profileData.email || ''}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            disabled
                                        />
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.email || emailFallback}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t('phone')}</Label>
                                    {isEditing ? (
                                        <Input
                                            id="phone"
                                            value={profileData.phone || ''}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                        />
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.phone || "Not set"}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dateOfBirth">{t('date_of_birth')}</Label>
                                    {isEditing ? (
                                        <Input
                                            id="dateOfBirth"
                                            type="date"
                                            value={profileData.dateOfBirth || ''}
                                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                        />
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.dateOfBirth || "Not set"}</p>
                                    )}
                                </div>

                                {/* <div className="space-y-2">
                                    <Label htmlFor="gender">{t('gender')}</Label>
                                    {isEditing ? (
                                        <Input
                                            id="gender"
                                            value={profileData.gender || ''}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                        />
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.gender || "Not set"}</p>
                                    )}
                                </div> */}

                                <div className="space-y-2">
                                    <Label htmlFor="address">{t('address')}</Label>
                                    {isEditing ? (
                                        <Input
                                            id="address"
                                            value={profileData.address || ''}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                        />
                                    ) : (
                                        <p className="py-2 px-3 bg-muted rounded-md">{profileData.address || "Not set"}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">{t('role')}</Label>
                                    <p className="py-2 px-3 bg-muted rounded-md text-primary">{profileData.role}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">{t('status')}</Label>
                                    <p className="py-2 px-3 bg-muted rounded-md">{profileData.status}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Change Password Modal */}
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t("Change Password")}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="oldPassword">{t("Old Password")}</Label>
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="newPassword">{t("New Password")}</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="confirmPassword">{t("Confirm Password")}</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                            {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                                {t("Cancel")}
                            </Button>
                            <Button onClick={handleChangePassword} disabled={loading}>
                                {t("Update Password")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}