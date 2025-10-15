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
import { Mail } from "lucide-react";

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

    //For Email OTP
    const [isEmailChangeDialogOpen, setIsEmailChangeDialogOpen] = useState(false);
    const [newEmailInput, setNewEmailInput] = useState("");
    const [emailChangeStep, setEmailChangeStep] = useState<"input" | "otp">("input"); // 2 bước: nhập email, nhập OTP
    const [emailOtpCode, setEmailOtpCode] = useState("");
    const [emailChangeError, setEmailChangeError] = useState<string | null>(null);
    const [emailChangeSuccess, setEmailChangeSuccess] = useState<string | null>(null);
    const [emailChangeLoading, setEmailChangeLoading] = useState(false);
    const [emailOtpSent, setEmailOtpSent] = useState(false);

    // Collect from localStorage
    const userId = localStorage.getItem("userId");  //từ login
    const token = localStorage.getItem("token");
    const emailFallback = localStorage.getItem("email") || "";  // Từ decoded sub

    // -------------------- EMAIL CHANGE-------------------- //
    const handleOpenEmailChangeDialog = () => {
        setNewEmailInput("");
        setEmailOtpCode("");
        setEmailChangeStep("input");
        setEmailChangeError(null);
        setEmailChangeSuccess(null);
        setIsEmailChangeDialogOpen(true);
    };

    const handleSendOTPForEmailChange = async () => {
        if (!newEmailInput) {
            setEmailChangeError("Please enter a valid email.");
            return;
        }
        try {
            setEmailChangeLoading(true);
            setEmailChangeError(null);
            await axios.post(
                "http://localhost:8080/api/otp/send/email-change",
                { email: newEmailInput },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEmailOtpSent(true);
            setEmailChangeStep("otp");
            setEmailChangeSuccess("OTP sent to " + newEmailInput);
        } catch (err: any) {
            console.error("Send email OTP error:", err);
            setEmailChangeError(
                "Failed to send OTP: " + (err.response?.data?.message || err.message)
            );
        } finally {
            setEmailChangeLoading(false);
        }
    };

    const handleVerifyOTPAndChangeEmail = async () => {
        if (!emailOtpCode) {
            setEmailChangeError("Please enter the OTP code.");
            return;
        }
        try {
            setEmailChangeLoading(true);
            setEmailChangeError(null);
            await axios.post(
                "http://localhost:8080/api/otp/verify/email-change",
                { email: newEmailInput, otpCode: emailOtpCode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProfileData((prev: any) => ({ ...prev, email: newEmailInput }));
            localStorage.setItem("email", newEmailInput);
            setEmailChangeSuccess("Email changed successfully to " + newEmailInput);
            setTimeout(() => setIsEmailChangeDialogOpen(false), 1500);
        } catch (err: any) {
            console.error("Verify email OTP error:", err);
            setEmailChangeError(
                "Failed to verify OTP: " + (err.response?.data?.message || err.message)
            );
        } finally {
            setEmailChangeLoading(false);
        }
    };

    const handleCloseEmailChangeDialog = () => {
        setIsEmailChangeDialogOpen(false);
        setEmailChangeStep("input");
        setNewEmailInput("");
        setEmailOtpCode("");
        setEmailChangeError(null);
        setEmailChangeSuccess(null);
        setEmailOtpSent(false);
    };

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
                const normalizedData: UserProfile = {
                    userId: profile.userId,
                    fullName: profile.fullName || profile.username || "",
                    email: profile.email,
                    phone: profile.phoneNumber || null,
                    dateOfBirth: profile.dateOfBirth || null,
                    gender: profile.gender || null,
                    role: profile.role,
                    address: profile.address || null,
                    status: profile.status,
                };
                setProfileData(normalizedData);
                console.log("Profile fetched:", profile);
            } catch (err: any) {
                console.error("Fetch profile error:", err);
                if (err.response?.status === 405 || err.response?.status === 400) {
                    setError("Endpoint mismatch (405/400). Fallback to local data.");
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
                    dateOfBirth: localStorage.getItem("dateOfBirth") || null,
                    gender: null,
                    role: localStorage.getItem("role") || "DRIVER",
                    address: null,
                    status: "ACTIVE",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProfile().then(r =>  {});  // Avoid unused promise warning
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
            setLoading(true);
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

    const fieldGroups = [
        { label: t('full_name'), field: 'fullName' },
        { label: t('email'), field: 'email', disabled: true },
        { label: t('phone'), field: 'phone' },
        { label: t('address'), field: 'address' },
        { label: t('date_of_birth'), field: 'dateOfBirth', type: 'date' },
        { label: t('role'), field: 'role', disabled: true },
        { label: t('status'), field: 'status', disabled: true },
        { label: t('gender'), field: 'gender' },
    ];

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
                                        <>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={profileData.email || ''}
                                                disabled
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 flex items-center space-x-2 text-sm"
                                                onClick={handleOpenEmailChangeDialog}
                                            >
                                                <Mail className="w-4 h-4" />
                                                <span>{t('Change Email')}</span>
                                            </Button>
                                        </>
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
                    <DialogContent className="max-w-lg w-full rounded-xl p-6 bg-card overflow-y-auto">
                        <DialogHeader className="border-b pb-4">
                            <DialogTitle className="text-lg font-semibold">{t("Change Password")}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                            <div className="space-y-2">
                                <Label htmlFor="oldPassword" className="text-sm font-medium">
                                    {t("Old Password")}
                                </Label>
                                <Input
                                    id="oldPassword"
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="border border-slate-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="newPassword" className="text-sm font-medium">
                                    {t("New Password")}
                                </Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="border border-slate-300 rounded-md px-3 py-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                                    {t("Confirm Password")}
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    className="border border-slate-300 rounded-md px-3 py-2"
                                />
                            </div>

                            {passwordError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                                    {passwordSuccess}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="border-t pt-4 gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsPasswordDialogOpen(false)}
                            >
                                {t("Cancel")}
                            </Button>
                            <Button
                                onClick={handleChangePassword}
                                disabled={loading}
                                className="bg-blue-500 text-white hover:bg-blue-600"
                            >
                                {loading ? t("loading") : t("Update Password")}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                {/* Change Email Modal */}

                <Dialog open={isEmailChangeDialogOpen} onOpenChange={handleCloseEmailChangeDialog}>
                    <DialogContent className="max-w-lg w-full rounded-xl p-6 bg-card overflow-y-auto">
                        <DialogHeader className="border-b pb-4">
                            <DialogTitle className="text-lg font-semibold">
                                {emailChangeStep === "input" ? t("Change Email") : t("Verify OTP")}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
                            {/* STEP 1: Input new email */}
                            {emailChangeStep === "input" && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="currentEmail" className="text-sm font-medium">
                                            {t("Current Email")}
                                        </Label>
                                        <Input
                                            id="currentEmail"
                                            type="email"
                                            value={profileData.email}
                                            disabled
                                            className="bg-gray-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="newEmail" className="text-sm font-medium">
                                            {t("New Email")}
                                        </Label>
                                        <Input
                                            id="newEmail"
                                            type="email"
                                            value={newEmailInput}
                                            onChange={(e) => setNewEmailInput(e.target.value)}
                                            placeholder="Enter new email"
                                            disabled={emailChangeLoading}
                                            className="border border-slate-300 rounded-md px-3 py-2"
                                        />
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        {t("We will send a verification code to your new email address.")}
                                    </p>
                                </>
                            )}

                            {/* STEP 2: Input OTP */}
                            {emailChangeStep === "otp" && (
                                <>
                                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-md">
                                        <p className="text-sm text-blue-700">
                                            {t("A verification code has been sent to:")} <br />
                                            <strong>{newEmailInput}</strong>
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="emailOtp" className="text-sm font-medium">
                                            {t("Verification Code")}
                                        </Label>
                                        <Input
                                            id="emailOtp"
                                            type="text"
                                            value={emailOtpCode}
                                            onChange={(e) => setEmailOtpCode(e.target.value.slice(0, 6))}
                                            placeholder="Enter 6-digit code"
                                            maxLength={6}
                                            disabled={emailChangeLoading}
                                            className="border border-slate-300 rounded-md px-3 py-2 text-center text-lg tracking-widest"
                                        />
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        {t("Code expires in 5 minutes")}
                                    </p>

                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setEmailChangeStep("input");
                                            setEmailOtpCode("");
                                            setEmailOtpSent(false);
                                        }}
                                        className="w-full text-sm"
                                    >
                                        {t("Back")}
                                    </Button>
                                </>
                            )}

                            {/* Error message */}
                            {emailChangeError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                                    {emailChangeError}
                                </div>
                            )}

                            {/* Success message */}
                            {emailChangeSuccess && (
                                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                                    {emailChangeSuccess}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="border-t pt-4 gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCloseEmailChangeDialog}
                                disabled={emailChangeLoading}
                            >
                                {t("Cancel")}
                            </Button>

                            {emailChangeStep === "input" ? (
                                <Button
                                    onClick={handleSendOTPForEmailChange}
                                    disabled={emailChangeLoading}
                                    className="bg-blue-500 text-white hover:bg-blue-600"
                                >
                                    {emailChangeLoading ? t("loading") : t("Send Code")}
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleVerifyOTPAndChangeEmail}
                                    disabled={emailChangeLoading}
                                    className="bg-blue-500 text-white hover:bg-blue-600"
                                >
                                    {emailChangeLoading ? t("loading") : t("Verify & Change Email")}
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>
        </div>
    );
}