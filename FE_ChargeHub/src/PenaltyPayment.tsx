import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import PenaltyPaymentView from "./components/PenaltyPaymentView";
import { useLanguage } from "./contexts/LanguageContext";

export default function PenaltyPayment() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const penaltyUserId = useMemo(() => {
    const storedIds = [
      localStorage.getItem("penaltyUserId"),
      localStorage.getItem("userId"),
    ];

    for (const id of storedIds) {
      if (!id) continue;
      const numericId = Number(id);
      if (Number.isFinite(numericId) && numericId > 0) {
        return numericId;
      }
    }

    return 0;
  }, []);

  useEffect(() => {
    if (penaltyUserId === 0) {
      toast.error(
        language === "vi"
          ? "Không xác định được tài khoản cần thanh toán phí phạt."
          : "Unable to identify the account that needs penalty payment."
      );
      navigate("/login", { replace: true });
    }
  }, [penaltyUserId, navigate, language]);

  if (penaltyUserId === 0) {
    return null;
  }

  return (
    <PenaltyPaymentView
      userId={penaltyUserId}
      onBack={() => navigate("/login", { replace: true })}
    />
  );
}

