import { useState, useCallback, useRef, useEffect } from "react";
import { validateCaregiverPhone } from "@/utils/onboardingHelpers";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";

const PHONE_REGEX = /^[6-9]\d{9}$/;
const DEBOUNCE_DELAY = 400; // ms

export function useCaregiverValidation() {
  const { t } = useTranslation();
  const user = useSelector((state: any) => state.auth.user);
  
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "checking" | "found" | "not-found">("idle");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundName, setFoundName] = useState("");

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const performPhoneLookup = useCallback(async (digits: string) => {
    setIsLookingUp(true);
    setLookupStatus("checking");
    setFoundName("");
    try {
      const result = await validateCaregiverPhone(digits);
      if (result.success) {
        setLookupStatus(result.data?.found || result.data?.exists || result.data?.id || result.data?._id || result.data?.userId ? "found" : "not-found");
        if (result.data?.name) {
          setFoundName(result.data.name);
        }
      } else {
        setLookupStatus("not-found");
      }
    } catch (e) {
      setLookupStatus("not-found");
    } finally {
      setIsLookingUp(false);
    }
  }, []);

  const validateAndLookup = useCallback((phone: string, setPhoneCallback: (p: string) => void) => {
    setPhoneCallback(phone);
    setPhoneError("");
    setLookupStatus("idle");
    setFoundName("");

    const digits = phone.replace(/\D/g, "");

    if (digits.length === 0) return;

    if (digits.length < 10) {
      setPhoneError(t("onboarding.step3.validation.tooShort") || "Phone number too short");
      return;
    }

    if (digits.length > 10) {
      setPhoneError(t("onboarding.step3.validation.tooLong") || "Phone number too long");
      return;
    }

    if (!PHONE_REGEX.test(digits)) {
      setPhoneError(t("onboarding.step3.validation.invalidFormat") || "Invalid phone format");
      return;
    }

    if (digits === user?.phone) {
      setPhoneError(t("onboarding.step3.validation.sameAsUser") || "Cannot use your own phone number");
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      performPhoneLookup(digits);
    }, DEBOUNCE_DELAY);
  }, [user?.phone, t, performPhoneLookup]);

  return {
    phoneError,
    setPhoneError,
    lookupStatus,
    setLookupStatus,
    isLookingUp,
    validateAndLookup,
    foundName
  };
}
