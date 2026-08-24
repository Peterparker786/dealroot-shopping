import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { FiPackage } from "react-icons/fi";
import { optimizeImage } from "./utils/cloudinary";
import {
  INDIAN_STATES,
  CITIES_BY_STATE,
} from "./utils/indianAddressData";
import "./AccountModal.css";

const emptyAuthForm = {
  name: "",
  email: "",
  password: "",
};

const emptyProfile = {
  name: "",
  phone: "",
  address: "",
  city: "Kanpur",
  pincode: "",
};

const emptyAddress = {
  name: "",
  phone: "",
  address: "",
  state: "Uttar Pradesh",
  city: "",
  pincode: "",
};

// ---- Order status timeline (Placed → Packed → Shipped → Delivered) ----
const TIMELINE_STATUSES = ["placed", "packed", "shipped", "delivered"];
const TIMELINE_LABELS = {
  placed: "Placed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

const shortDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
};

// Builds the timeline steps for one order. "confirmed" counts as Placed.
function orderTimelineSteps(order) {
  const status = order?.orderStatus || "placed";
  const currentIndex = TIMELINE_STATUSES.indexOf(status);
  const rank =
    status === "confirmed" ? 0 : currentIndex < 0 ? 0 : currentIndex;

  const history = Array.isArray(order?.statusHistory)
    ? order.statusHistory
    : [];

  const steps = TIMELINE_STATUSES.map((stepStatus, index) => {
    const entry = history.find((item) => item.status === stepStatus);

    return {
      key: stepStatus,
      label: TIMELINE_LABELS[stepStatus],
      done: index <= rank,
      date:
        entry?.at ||
        (index === 0 ? order?.createdAt : "") ||
        (status === stepStatus ? order?.updatedAt : ""),
    };
  });

  if (status === "cancelled") {
    const cancelEntry = history.find((item) => item.status === "cancelled");

    steps.push({
      key: "cancelled",
      label: "Cancelled",
      done: false,
      date: cancelEntry?.at || order?.cancelledAt || "",
      cancelled: true,
    });
  }

  return steps;
}

function OrderTimeline({ order }) {
  const steps = orderTimelineSteps(order);

  return (
    <div className="order-timeline">
      {steps.map((step) => (
        <div
          key={step.key}
          className={`timeline-step ${step.done ? "done" : "pending"}${
            step.cancelled ? " cancelled" : ""
          }`}
        >
          <span className="timeline-dot" aria-hidden="true" />
          <div>
            <b>{step.label}</b>
            {step.date && <small>{shortDate(step.date)}</small>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MascotArt({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="maBody"
          x1="90"
          y1="30"
          x2="150"
          y2="186"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#eaf1ff" />
          <stop offset="1" stopColor="#cfe3ff" />
        </linearGradient>
        <linearGradient
          id="maCape"
          x1="62"
          y1="92"
          x2="158"
          y2="186"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#8b5cf6" />
          <stop offset="0.5" stopColor="#d946ef" />
          <stop offset="1" stopColor="#f472b6" />
        </linearGradient>
        <linearGradient
          id="maWand"
          x1="150"
          y1="60"
          x2="196"
          y2="106"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffe4f1" />
        </linearGradient>
      </defs>

      <g className="ma-sparkles" opacity="0.95">
        <path
          d="M34 54 l4 9 9 4 -9 4 -4 9 -4 -9 -9 -4 9 -4 z"
          fill="#ffffff"
          opacity="0.95"
        />
        <path
          d="M188 152 l3.5 7.5 7.5 3.5 -7.5 3.5 -3.5 7.5 -3.5 -7.5 -7.5 -3.5 7.5 -3.5 z"
          fill="#ffffff"
          opacity="0.8"
        />
        <circle cx="48" cy="152" r="3" fill="#ffffff" opacity="0.75" />
        <circle cx="176" cy="54" r="2.6" fill="#ffffff" opacity="0.85" />
      </g>

      <path
        d="M110 92 C 74 108 60 140 62 172 C 96 188 128 190 158 176 C 156 142 140 108 110 92 Z"
        fill="url(#maCape)"
        opacity="0.92"
      />

      <path
        d="M110 30 C 62 30 40 74 40 118 C 40 164 72 186 110 186 C 148 186 180 164 180 118 C 180 74 158 30 110 30 Z"
        fill="url(#maBody)"
        stroke="#ffffff"
        strokeWidth="4"
      />

      <ellipse cx="76" cy="128" rx="11" ry="7" fill="#fda4c4" opacity="0.85" />
      <ellipse cx="144" cy="128" rx="11" ry="7" fill="#fda4c4" opacity="0.85" />

      <ellipse cx="88" cy="106" rx="8.5" ry="10" fill="#17324f" />
      <ellipse cx="132" cy="106" rx="8.5" ry="10" fill="#17324f" />
      <circle cx="91" cy="101" r="3.2" fill="#ffffff" />
      <circle cx="135" cy="101" r="3.2" fill="#ffffff" />

      <path
        d="M100 132 Q110 144 120 132"
        stroke="#17324f"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />

      <g>
        <circle cx="95" cy="42" r="9" fill="#f9a8d4" />
        <circle cx="110" cy="34" r="9" fill="#c4b5fd" />
        <circle cx="126" cy="43" r="9" fill="#fcd34d" />
        <circle cx="95" cy="42" r="3.4" fill="#ffffff" opacity="0.8" />
        <circle cx="110" cy="34" r="3.4" fill="#ffffff" opacity="0.8" />
        <circle cx="126" cy="43" r="3.4" fill="#ffffff" opacity="0.8" />
      </g>

      <line
        x1="160"
        y1="80"
        x2="182"
        y2="58"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <line
        x1="160"
        y1="80"
        x2="182"
        y2="58"
        stroke="#d8b4fe"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M196 34 l5.5 12 12 5.5 -12 5.5 -5.5 12 -5.5 -12 -12 -5.5 12 -5.5 z"
        fill="url(#maWand)"
        stroke="#ffffff"
        strokeWidth="2"
      />

      <ellipse cx="110" cy="199" rx="58" ry="9" fill="rgba(10,30,70,0.22)" />
    </svg>
  );
}

export default function AccountModal({
  isOpen,
  onClose,
  apiUrl,
  user,
  token,
  onAuth,
  onLogout,
  onUserUpdated,
  showToast,
  initialTab,
}) {
  const [mode, setMode] = useState("login");
  const [tab, setTab] = useState("profile");

  // When the modal is opened from a deep link (e.g. the order-confirmation
  // email's "My Orders" button), or the navbar's Track Order button is
  // pressed while the modal is already open, switch to the requested tab.
  useEffect(() => {
    if (isOpen && initialTab) {
      setTab(initialTab);
      setForgotMode(false);
    }
  }, [isOpen, initialTab]);
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [authError, setAuthError] = useState("");
  const [profile, setProfile] = useState(emptyProfile);
  const [addresses, setAddresses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState(emptyAddress);
  const [addressErrors, setAddressErrors] = useState({});
  const [editorSelectedState, setEditorSelectedState] = useState(null);
  const [editorSelectedCity, setEditorSelectedCity] = useState(null);

  const stateOptions = INDIAN_STATES;
  const editorCityOptions = useMemo(() => {
    if (!editorSelectedState) return [];

    const baseCities = CITIES_BY_STATE[editorSelectedState.value] || [];
    const savedCity = String(draft.city || "").trim();
    const cities =
      savedCity && !baseCities.includes(savedCity)
        ? [savedCity, ...baseCities]
        : baseCities;

    return cities.map((city) => ({
      value: city,
      label: city,
    }));
  }, [editorSelectedState, draft.city]);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [otpData, setOtpData] = useState({
    email: "",
    otp: "",
    password: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [emailNotFound, setEmailNotFound] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  // Returns & refunds (Amazon-style: reasons + photo/video proof + UPI).
  const RETURN_REASONS = [
    "Product is defective / not working",
    "Item arrived damaged or broken",
    "Wrong item was delivered",
    "Product quality not as expected",
    "Missing parts / accessories",
    "Change of mind (no longer needed)",
  ];
  const [returns, setReturns] = useState([]);
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDescription, setReturnDescription] = useState("");
  const [returnImages, setReturnImages] = useState([]);
  const [returnVideo, setReturnVideo] = useState(null);
  const [returnUpi, setReturnUpi] = useState("");
  const [returnErrors, setReturnErrors] = useState({});
  const [returnConfirm, setReturnConfirm] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  // Login & Security (Amazon-style) editor state.
  const [securityEdit, setSecurityEdit] = useState(null); // name | email | phone | password
  const [secForm, setSecForm] = useState({
    name: "",
    newEmail: "",
    newPhone: "",
    otp: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [secOtpSent, setSecOtpSent] = useState(false);
  const [secSubmitting, setSecSubmitting] = useState(false);
  const [secError, setSecError] = useState("");
  const [secFieldErrors, setSecFieldErrors] = useState({});

  useEffect(() => {
    if (!user) {
      setProfile(emptyProfile);
      return;
    }

    setProfile({
      name: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "Kanpur",
      pincode: user.pincode || "",
    });

    // Sync the address book. Seed it from the legacy flat address the first
    // time (users who saved a single address before this feature existed).
    const list = Array.isArray(user.addresses) ? user.addresses : [];
    if (list.length === 0 && user.address) {
      setAddresses([
        {
          name: user.name || "",
          phone: user.phone || "",
          address: user.address || "",
          state: user.state || "Uttar Pradesh",
          city: user.city || "Kanpur",
          pincode: user.pincode || "",
          isDefault: true,
        },
      ]);
    } else {
      setAddresses(list);
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) {
      setAuthError("");
      setSaveSuccess(false);
      setResendIn(0);
      setEditingIndex(null);
      setDraft(emptyAddress);
      setAddressErrors({});
      setEditorSelectedState(null);
      setEditorSelectedCity(null);
      setSecurityEdit(null);
      setSecOtpSent(false);
      setSecSubmitting(false);
      setSecError("");
      setSecFieldErrors({});
      setReturnOrderId(null);
      setReturnReason("");
      setReturnDescription("");
      setReturnImages([]);
      setReturnVideo(null);
      setReturnUpi("");
      setReturnErrors({});
      setReturnConfirm(false);
      return undefined;
    }

    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", closeWithEscape);

    return () => {
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !user || !token || tab !== "orders") {
      return undefined;
    }

    let requestCancelled = false;

    const loadOrders = async () => {
      try {
        setLoadingOrders(true);

        const response = await fetch(`${apiUrl}/api/auth/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Could not load orders");
        }

        if (!requestCancelled) {
          setOrders(data.orders || []);
        }
      } catch (error) {
        if (!requestCancelled) {
          showToast?.(error.message);
        }
      } finally {
        if (!requestCancelled) {
          setLoadingOrders(false);
        }
      }
    };

    loadOrders();

    return () => {
      requestCancelled = true;
    };
  }, [apiUrl, isOpen, showToast, tab, token, user]);

  // Load my return requests so order cards can show their status.
  useEffect(() => {
    if (!isOpen || !user || !token || tab !== "orders") {
      return undefined;
    }

    let requestCancelled = false;

    const loadReturns = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/returns/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!requestCancelled && data.success) {
          setReturns(data.returns || []);
        }
      } catch {
        // Ignore — return status is a bonus, not critical.
      }
    };

    loadReturns();

    return () => {
      requestCancelled = true;
    };
  }, [apiUrl, isOpen, tab, token, user]);

  // 30s countdown before the user can request another OTP.
  useEffect(() => {
    if (resendIn <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setResendIn((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendIn]);

  if (!isOpen) {
    return null;
  }

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setAuthForm(emptyAuthForm);
    setAuthError("");
  };

  const updateAuthForm = (event) => {
    const { name, value } = event.target;

    setAuthForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (authError) {
      setAuthError("");
    }
  };

  const updateOtpForm = (event) => {
    const { name, value } = event.target;

    setOtpData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateProfile = (event) => {
    const { name, value } = event.target;
    let cleanValue = value;

    if (name === "phone") {
      cleanValue = value.replace(/\D/g, "").slice(0, 10);
    }

    if (name === "pincode") {
      cleanValue = value.replace(/\D/g, "").slice(0, 6);
    }

    setProfile((current) => ({
      ...current,
      [name]: cleanValue,
    }));
  };

  const sendOTP = async () => {
    try {
      setSubmitting(true);
      setEmailNotFound(false);
      const res = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: otpData.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = (data.message || "").toLowerCase();
        // Detect "user not found" / "email not registered" type responses
        if (msg.includes("not found") || msg.includes("not registered") || msg.includes("doesn't exist")) {
          setEmailNotFound(true);
          return;
        }
        throw new Error(data.message || "Failed to send OTP");
      }

      showToast?.("OTP sent successfully");
      setOtpSent(true);
      setResendIn(30);
    } catch (err) {
      showToast?.(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setAuthError("");

    try {
      setSubmitting(true);

      const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: otpData.email,
          otp: otpData.otp,
          password: otpData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Could not reset password");

      showToast?.("Password reset successfully");
      setForgotMode(false);
      setOtpSent(false);
      setOtpData({ email: "", otp: "", password: "" });
      setResendIn(0);
    } catch (err) {
      setAuthError(err.message);
      showToast?.(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setAuthError("");

    try {
      setSubmitting(true);

      const payload =
        mode === "signup"
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password,
            };

      const response = await fetch(`${apiUrl}/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        let errorMessage =
          data.message ||
          (mode === "login"
            ? "Could not log in. Please try again."
            : "Could not create your account.");

        if (mode === "login" && response.status === 401) {
          errorMessage = "Incorrect email or password.";
        }

        throw new Error(errorMessage);
      }

      onAuth(data.token, data.user);
      setAuthForm(emptyAuthForm);
      setAuthError?.("");

      if (mode === "login") {
        if (initialTab === "orders") {
          // Opened from "Track Order": jump straight to My Orders
          // instead of closing the modal.
          setTab("orders");
          showToast?.("Login successful — here are your orders");
        } else {
          showToast?.("Login successful");

          setTimeout(() => {
            onClose();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }, 800);
        }
      } else {
        setTab(initialTab === "orders" ? "orders" : "profile");
        showToast?.("Account created successfully");
      }
    } catch (error) {
      const errorMessage =
        error instanceof TypeError
          ? "Could not connect to the server. Please try again."
          : error.message || "Could not continue. Please try again.";

      setAuthError(errorMessage);
      showToast?.(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const persistProfile = async (nextAddresses, successMessage) => {
    try {
      setSubmitting(true);
      setSaveSuccess(false);

      const response = await fetch(`${apiUrl}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          addresses: nextAddresses,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save profile");
      }

      onUserUpdated(data.user);
      setSaveSuccess(true);
      showToast?.(successMessage || "Details saved successfully");
    } catch (error) {
      setSaveSuccess(false);
      showToast?.(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    // If the address editor is open with unsaved changes, fold them into the
    // address list before saving — otherwise "Save details" would silently
    // drop the user's in-progress State/City edits.
    const nextAddresses =
      editingIndex !== null ? commitDraft() : addresses;

    if (nextAddresses !== null) {
      await persistProfile(nextAddresses);
    }
  };

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));

    if (addressErrors[field]) {
      setAddressErrors((current) => ({ ...current, [field]: "" }));
    }
  };

  const startEditAddress = (index) => {
    const nextDraft = index === -1 ? emptyAddress : { ...addresses[index] };
    setDraft(nextDraft);
    setEditingIndex(index);
    setAddressErrors({});

    // Sync the state/city dropdowns with the address being edited.
    const state = INDIAN_STATES.find((s) => s.label === nextDraft.state);
    setEditorSelectedState(
      state ? { value: state.value, label: state.label } : null
    );
    const cities = state ? CITIES_BY_STATE[state.value] || [] : [];
    setEditorSelectedCity(
      cities.includes(nextDraft.city)
        ? { value: nextDraft.city, label: nextDraft.city }
        : null
    );
  };

  const validateDraft = () => {
    const errors = {};

    if (!draft.name.trim()) {
      errors.name = "Please enter the recipient's name";
    }
    if (draft.phone.length !== 10) {
      errors.phone = "Please enter a valid 10-digit mobile number";
    }
    if (!draft.address.trim()) {
      errors.address = "Please enter the complete address";
    }
    if (!draft.city.trim()) {
      errors.city = "Please enter the city";
    }
    if (!draft.state.trim()) {
      errors.state = "Please enter the state";
    }
    if (draft.pincode.length !== 6) {
      errors.pincode = "Please enter a valid 6-digit pincode";
    }

    return errors;
  };

  // Validate the open editor draft and, if valid, commit it into the address
  // list (local state). Returns the updated list, or null when invalid so the
  // caller can stop before persisting.
  const commitDraft = () => {
    const errors = validateDraft();

    if (Object.keys(errors).length) {
      setAddressErrors(errors);
      return null;
    }

    const updated =
      editingIndex === -1
        ? [...addresses, { ...draft, isDefault: addresses.length === 0 }]
        : addresses.map((addr, i) =>
            i === editingIndex ? { ...addr, ...draft } : addr
          );

    setAddresses(updated);
    setEditingIndex(null);
    setDraft(emptyAddress);
    setAddressErrors({});
    setEditorSelectedState(null);
    setEditorSelectedCity(null);
    return updated;
  };

  const saveAddress = () => {
    const wasAdding = editingIndex === -1;
    const updated = commitDraft();

    if (updated === null) {
      return;
    }

    persistProfile(updated, wasAdding ? "Address added" : "Address updated");
  };

  const markDefaultAddress = (index) => {
    const updated = addresses.map((addr, i) => ({
      ...addr,
      isDefault: i === index,
    }));

    setAddresses(updated);
    persistProfile(updated, "Default address updated");
  };

  const deleteAddress = (index) => {
    const remaining = addresses.filter((_, i) => i !== index);

    if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
      remaining[0].isDefault = true;
    }

    setAddresses(remaining);
    persistProfile(remaining, "Address removed");
  };

  // ---------- Login & Security ----------

  const resetSecurity = () => {
    setSecurityEdit(null);
    setSecForm({
      name: "",
      newEmail: "",
      newPhone: "",
      otp: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setSecOtpSent(false);
    setSecError("");
    setSecFieldErrors({});
  };

  const startSecEdit = (which) => {
    if (securityEdit === which) {
      resetSecurity();
      return;
    }

    setSecForm({
      name: user.name || "",
      newEmail: "",
      newPhone: "",
      otp: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setSecOtpSent(false);
    setSecError("");
    setSecFieldErrors({});
    setSecurityEdit(which);
  };

  const secRequestOtp = async () => {
    setSecError("");

    const field = securityEdit === "email" ? "newEmail" : "newPhone";
    const value = String(secForm[field] || "").trim();
    const errors = {};

    if (securityEdit === "email") {
      if (!/^\S+@\S+\.\S+$/.test(value)) {
        errors.newEmail = "Please enter a valid email address";
      } else if (value.toLowerCase() === (user.email || "").toLowerCase()) {
        errors.newEmail = "This is already your email address";
      }
    } else if (value.length !== 10) {
      errors.newPhone = "Please enter a valid 10-digit mobile number";
    }

    if (Object.keys(errors).length) {
      setSecFieldErrors(errors);
      return;
    }

    setSecFieldErrors({});

    try {
      setSecSubmitting(true);

      const endpoint =
        securityEdit === "email"
          ? "request-email-change"
          : "request-phone-change";
      const payload =
        securityEdit === "email"
          ? { newEmail: value }
          : { newPhone: value };

      const res = await fetch(`${apiUrl}/api/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not send OTP");
      }

      setSecOtpSent(true);
      setResendIn(30);
      showToast?.("OTP sent to your current email");
    } catch (err) {
      const msg = err.message || "Could not send OTP";

      // If the new email/phone already belongs to another account, show the
      // error right under the field so the user knows to pick something else.
      if (/already exists|already registered/i.test(msg)) {
        const field = securityEdit === "email" ? "newEmail" : "newPhone";
        setSecFieldErrors({ [field]: msg });
      } else {
        setSecError(msg);
      }

      showToast?.(msg);
    } finally {
      setSecSubmitting(false);
    }
  };

  const secVerifyChange = async () => {
    setSecError("");

    if (!String(secForm.otp || "").trim()) {
      setSecFieldErrors({ otp: "Please enter the OTP" });
      return;
    }

    try {
      setSecSubmitting(true);

      const endpoint =
        securityEdit === "email"
          ? "verify-email-change"
          : "verify-phone-change";

      const res = await fetch(`${apiUrl}/api/auth/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp: secForm.otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Verification failed");
      }

      onUserUpdated(data.user);
      setProfile((current) => ({
        ...current,
        name: data.user.name || current.name,
        phone: data.user.phone || current.phone,
      }));
      showToast?.(data.message || "Updated successfully");
      resetSecurity();
    } catch (err) {
      setSecError(err.message);
      showToast?.(err.message);
    } finally {
      setSecSubmitting(false);
    }
  };

  const saveSecName = async () => {
    setSecError("");

    const name = String(secForm.name || "").trim();

    if (name.length < 2) {
      setSecFieldErrors({ name: "Please enter your full name" });
      return;
    }

    try {
      setSecSubmitting(true);

      const res = await fetch(`${apiUrl}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone: profile.phone,
          addresses,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not save name");
      }

      onUserUpdated(data.user);
      setProfile((current) => ({
        ...current,
        name: data.user.name,
      }));
      showToast?.("Name updated successfully");
      resetSecurity();
    } catch (err) {
      setSecError(err.message);
      showToast?.(err.message);
    } finally {
      setSecSubmitting(false);
    }
  };

  const changePassword = async () => {
    setSecError("");

    const errors = {};

    if (!secForm.currentPassword) {
      errors.currentPassword = "Enter your current password";
    }
    if (String(secForm.newPassword || "").length < 8) {
      errors.newPassword = "New password must be at least 8 characters";
    }
    if (secForm.newPassword !== secForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length) {
      setSecFieldErrors(errors);
      return;
    }

    try {
      setSecSubmitting(true);

      const res = await fetch(`${apiUrl}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: secForm.currentPassword,
          newPassword: secForm.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Could not change password");
      }

      showToast?.("Password changed successfully");
      resetSecurity();
    } catch (err) {
      setSecError(err.message);
      showToast?.(err.message);
    } finally {
      setSecSubmitting(false);
    }
  };

  // An order can be returned within 7 days of placing it (Amazon-style).
  const canReturnOrder = (order) => {
    if (order?.orderStatus === "cancelled") return false;

    const placedAt = new Date(order?.createdAt || Date.now()).getTime();
    return Date.now() - placedAt <= 7 * 24 * 60 * 60 * 1000;
  };

  const returnInfoFor = (order) =>
    returns.find(
      (item) =>
        item.order === order._id || item.orderNumber === order.orderNumber
    );

  const submitReturn = async (event) => {
    event.preventDefault();

    const errors = {};

    if (!returnReason) {
      errors.reason = "Please choose a return reason";
    }
    if (!returnUpi.trim()) {
      errors.upi = "Please enter your UPI ID to receive the refund";
    } else if (!/^[^@\s]+@[^@\s]+$/.test(returnUpi.trim())) {
      errors.upi = "Please enter a valid UPI ID (e.g. name@upi)";
    }

    if (!returnConfirm) {
      errors.confirm =
        "Please confirm that you understand the shipping fee is non-refundable";
    }

    if (Object.keys(errors).length) {
      setReturnErrors(errors);
      return;
    }

    try {
      setReturnSubmitting(true);

      const formData = new FormData();
      formData.append("orderId", returnOrderId);
      formData.append("reason", returnReason);
      formData.append("description", returnDescription);
      formData.append("upiId", returnUpi.trim());
      returnImages.forEach((file) => formData.append("images", file));
      if (returnVideo) {
        formData.append("video", returnVideo);
      }

      const response = await fetch(`${apiUrl}/api/returns`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not submit return request");
      }

      showToast?.(data.message || "Return request submitted");

      setReturnOrderId(null);
      setReturnReason("");
      setReturnDescription("");
      setReturnImages([]);
      setReturnVideo(null);
      setReturnUpi("");
      setReturnErrors({});
      setReturnConfirm(false);

      // Refresh the return list so the new status shows immediately.
      try {
        const res = await fetch(`${apiUrl}/api/returns/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const list = await res.json();
        if (list.success) setReturns(list.returns || []);
      } catch {
        // ignore
      }
    } catch (error) {
      showToast?.(error.message);
    } finally {
      setReturnSubmitting(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    setTab("profile");
    setOrders([]);
    setAuthForm(emptyAuthForm);
    setAuthError("");
    resetSecurity();
    showToast?.("Logged out successfully");
  };

  const statusLabel = (status = "placed") =>
    status.charAt(0).toUpperCase() + status.slice(1);

  const handleCopyTilt = (event) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--tilt-x", px.toFixed(3));
    el.style.setProperty("--tilt-y", py.toFixed(3));
  };

  const handleCopyTiltReset = (event) => {
    event.currentTarget.style.setProperty("--tilt-x", "0");
    event.currentTarget.style.setProperty("--tilt-y", "0");
  };

  return (
    <div
      className="account-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="account-modal"
        role="dialog"
        aria-modal="true"
        aria-label="DEALROOT account"
      >
        <header className="account-header">
          <div>
            <span className="eyebrow blue">DEALROOT ACCOUNT</span>
            <h2>
              {user
                ? `Hello, ${user.name?.split(" ")[0] || "Customer"}`
                : "Welcome to DEALROOT"}
            </h2>
          </div>

          <button
            className="drawer-close"
            type="button"
            onClick={onClose}
            aria-label="Close account"
          >
            &times;
          </button>
        </header>

        {!user ? (
          <div className="account-auth-wrap">
            <div
              className="account-auth-copy"
              onMouseMove={handleCopyTilt}
              onMouseLeave={handleCopyTiltReset}
            >
              <span className="auth-orb orb-a" aria-hidden="true" />
              <span className="auth-orb orb-b" aria-hidden="true" />
              <span className="auth-orb orb-c" aria-hidden="true" />

              <div className="auth-copy-layer">
                <span className="account-avatar">DEALROOT</span>
                <h3>Shopping gets easier with an account.</h3>
                <p>
                  Save your address, check every order, and enjoy a
                  faster checkout.
                </p>

                <ul>
                  <li>✓ Saved delivery details</li>
                  <li>✓ Personal order history</li>
                  <li>✓ Secure 7-day login session</li>
                </ul>
              </div>

              <div className="auth-mascot-wrap" aria-hidden="true">
                <span className="auth-float-chip chip-1">💄</span>
                <span className="auth-float-chip chip-2">✨</span>
                <MascotArt className="account-mascot" />
                <span className="mascot-shadow" />
              </div>
            </div>

            {!forgotMode ? (
              <form className="account-auth-form" onSubmit={submitAuth}>
                <div className="auth-mobile-mascot" aria-hidden="true">
                  <MascotArt className="auth-mobile-mascot-art" />
                </div>

                {initialTab === "orders" && !user && (
                  <div className="orders-intent-note">
                    <FiPackage size={15} />
                    {mode === "login"
                      ? "Sign in to track your orders and see their live status"
                      : "Create an account to start tracking your orders"}
                  </div>
                )}

                <div className="auth-switch">
                  <button
                    type="button"
                    className={mode === "login" ? "active" : ""}
                    onClick={() => changeMode("login")}
                  >
                    Log in
                  </button>

                  <button
                    type="button"
                    className={mode === "signup" ? "active" : ""}
                    onClick={() => changeMode("signup")}
                  >
                    Sign up
                  </button>
                </div>

                {mode === "signup" && (
                  <label>
                    Full name

                    <input
                      name="name"
                      type="text"
                      value={authForm.name}
                      onChange={updateAuthForm}
                      required
                      minLength="2"
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                  </label>
                )}

                <label>
                  Email address

                  <input
                    name="email"
                    type="email"
                    value={authForm.email}
                    onChange={updateAuthForm}
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>

                <label>
                  Password

                  <input
                    name="password"
                    type="password"
                    minLength="8"
                    value={authForm.password}
                    onChange={updateAuthForm}
                    required
                    placeholder="Minimum 8 characters"
                    autoComplete={
                      mode === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    aria-describedby={authError ? "account-auth-error" : undefined}
                  />
                </label>

                {mode === "login" && (
                  <div
                    style={{
                      textAlign: "right",
                      marginTop: "-8px",
                      marginBottom: "12px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#246bfd",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {authError && (
                  <div
                    id="account-auth-error"
                    role="alert"
                    style={{
                      padding: "12px 14px",
                      border: "1px solid #fda29b",
                      borderRadius: "10px",
                      background: "#fef3f2",
                      color: "#b42318",
                      fontSize: "14px",
                      fontWeight: 700,
                      lineHeight: 1.45,
                    }}
                  >
                    {authError}
                  </div>
                )}

                <button
                  className="primary-button account-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Please wait..."
                    : mode === "login"
                    ? "Log in"
                    : "Create account"}
                </button>
              </form>
            ) : (
              <form className="account-auth-form" onSubmit={(e) => { e.preventDefault(); if (otpSent) { resetPassword(e); } else { sendOTP(); } }}>
                <div className="auth-mobile-mascot" aria-hidden="true">
                  <MascotArt className="auth-mobile-mascot-art" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(false);
                    setOtpSent(false);
                    setEmailNotFound(false);
                    setOtpData({ email: "", otp: "", password: "" });
                    setAuthError("");
                    setResendIn(0);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#246bfd",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "13px",
                    textAlign: "left",
                    padding: 0,
                    marginBottom: "8px",
                  }}
                >
                  &larr; Back to login
                </button>

                <h3 style={{ margin: 0, fontSize: "21px", color: "#193651" }}>
                  Reset your password
                </h3>
                <p style={{ margin: "4px 0 16px", color: "#77899b", fontSize: "13px" }}>
                  {otpSent
                    ? "Enter the OTP sent to your email and set a new password."
                    : "Enter your email to receive a one-time password."}
                </p>

                <label>
                  Email address
                  <input
                    name="email"
                    type="email"
                    value={otpData.email}
                    onChange={updateOtpForm}
                    required
                    disabled={otpSent}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </label>                    {otpSent && (
                  <>
                    <label>
                      OTP
                      <input
                        name="otp"
                        type="text"
                        value={otpData.otp}
                        onChange={updateOtpForm}
                        required
                        placeholder="6-digit OTP"
                        autoComplete="one-time-code"
                      />
                    </label>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "-6px",
                        marginBottom: "14px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={sendOTP}
                        disabled={resendIn > 0 || submitting}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: resendIn > 0 || submitting ? "default" : "pointer",
                          color: resendIn > 0 ? "#98a6b4" : "#246bfd",
                          fontWeight: 600,
                          fontSize: "13px",
                          opacity: submitting ? 0.6 : 1,
                        }}
                      >
                        {resendIn > 0
                          ? `Resend OTP in ${resendIn}s`
                          : submitting
                          ? "Sending..."
                          : "Resend OTP"}
                      </button>
                    </div>

                    <label>
                      New password
                      <input
                        name="password"
                        type="password"
                        minLength="8"
                        value={otpData.password}
                        onChange={updateOtpForm}
                        required
                        placeholder="Minimum 8 characters"
                    autoComplete="new-password"
                    aria-describedby={authError ? "account-auth-error" : undefined}
                  />
                    </label>
                  </>
                )}

                {emailNotFound && (
                  <div
                    role="alert"
                    style={{
                      padding: "14px 16px",
                      border: "1px solid #fecaca",
                      borderRadius: "12px",
                      background: "#fef2f2",
                      color: "#991b1b",
                      fontSize: "13px",
                      lineHeight: 1.6,
                    }}
                  >
                    No account found with <strong>{otpData.email}</strong>.
                    <br />
                    Please{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setForgotMode(false);
                        setOtpSent(false);
                        setEmailNotFound(false);
                        setOtpData({ email: "", otp: "", password: "" });
                        setAuthError("");
                        setResendIn(0);
                        changeMode("signup");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontWeight: 700,
                        textDecoration: "underline",
                        padding: 0,
                        fontSize: "inherit",
                      }}
                    >
                      create an account
                    </button>
                    {" "}first.
                  </div>
                )}

                {authError && (
                  <div
                    id="account-auth-error"
                    role="alert"
                    style={{
                      padding: "12px 14px",
                      border: "1px solid #fda29b",
                      borderRadius: "10px",
                      background: "#fef3f2",
                      color: "#b42318",
                      fontSize: "14px",
                      fontWeight: 700,
                      lineHeight: 1.45,
                    }}
                  >
                    {authError}
                  </div>
                )}

                <button
                  className="primary-button account-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting
                    ? "Please wait..."
                    : otpSent
                    ? "Reset password"
                    : "Send OTP"}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="account-dashboard">
            <aside className="account-menu">
              <div className="account-user-card">
                <span>
                  {user.name?.charAt(0).toUpperCase() || "D"}
                </span>

                <div>
                  <b>{user.name}</b>
                  <small>{user.email}</small>
                </div>
              </div>

              <button
                type="button"
                className={tab === "profile" ? "active" : ""}
                onClick={() => setTab("profile")}
              >
                Profile & address
              </button>

              <button
                type="button"
                className={tab === "orders" ? "active" : ""}
                onClick={() => setTab("orders")}
              >
                My orders
              </button>

              <button
                type="button"
                className={tab === "security" ? "active" : ""}
                onClick={() => setTab("security")}
              >
                Login & security
              </button>

              <button
                className="account-logout"
                type="button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </aside>

            <div className="account-panel">
              {tab === "profile" ? (
                <form className="profile-form" onSubmit={saveProfile}>
                  <div className="full-field">
                    <span className="eyebrow blue">MY DETAILS</span>
                    <h3>Profile & address book</h3>
                    <p>
                      Save multiple addresses and pick one at checkout — just
                      like your favourite stores.
                    </p>
                  </div>

                  <label>
                    Full name

                    <input
                      name="name"
                      type="text"
                      value={profile.name}
                      onChange={updateProfile}
                      required
                    />
                  </label>

                  <label>
                    Email address

                    <input
                      type="email"
                      value={user.email || ""}
                      disabled
                    />
                  </label>

                  <label>
                    Mobile number

                    <input
                      name="phone"
                      type="tel"
                      value={profile.phone}
                      disabled
                      placeholder="Not added yet"
                    />
                    <small className="field-hint">
                      To change your mobile number, go to{" "}
                      <b>Login &amp; security</b>.
                    </small>
                  </label>

                  <div className="full-field">
                    <span className="eyebrow blue">ADDRESS BOOK</span>
                    <h3>Saved addresses</h3>
                  </div>

                  {addresses.length === 0 && editingIndex === null && (
                    <p className="address-book-empty">
                      No saved addresses yet — add your home, office or any
                      other address to speed up checkout.
                    </p>
                  )}

                  {addresses.map((addr, index) => (
                    <div
                      className={`saved-address ${
                        addr.isDefault ? "is-default" : ""
                      }`}
                      key={index}
                    >
                      <div className="saved-address-head">
                        <b>{addr.name}</b>
                        {addr.isDefault && (
                          <span className="default-badge">DEFAULT</span>
                        )}
                      </div>
                      <p className="saved-address-preview">
                        📍 {addr.city}, {addr.state} — {addr.pincode}
                      </p>
                      <p className="saved-address-phone">📞 {addr.phone}</p>
                      <div className="saved-address-actions">
                        <button
                          type="button"
                          onClick={() => markDefaultAddress(index)}
                          disabled={addr.isDefault}
                        >
                          {addr.isDefault ? "Default" : "Set as default"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditAddress(index)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => deleteAddress(index)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  {editingIndex !== null ? (
                    <div className="address-editor">
                      <div className="address-editor-head">
                        <b>
                          {editingIndex === -1
                            ? "Add new address"
                            : "Edit address"}
                        </b>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => {
                            setEditingIndex(null);
                            setAddressErrors({});
                            setEditorSelectedState(null);
                            setEditorSelectedCity(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>

                      <label>
                        Recipient name

                        <input
                          value={draft.name}
                          onChange={(e) =>
                            updateDraft("name", e.target.value)
                          }
                          placeholder="Who should receive the order?"
                        />
                        {addressErrors.name && (
                          <span className="field-error">
                            {addressErrors.name}
                          </span>
                        )}
                      </label>

                      <label>
                        Mobile number

                        <input
                          value={draft.phone}
                          onChange={(e) =>
                            updateDraft(
                              "phone",
                              e.target.value.replace(/\D/g, "").slice(0, 10)
                            )
                          }
                          inputMode="numeric"
                          maxLength="10"
                          placeholder="10-digit mobile number"
                        />
                        {addressErrors.phone && (
                          <span className="field-error">
                            {addressErrors.phone}
                          </span>
                        )}
                      </label>

                      <label className="full-field">
                        Complete address

                        <textarea
                          value={draft.address}
                          onChange={(e) =>
                            updateDraft("address", e.target.value)
                          }
                          rows="3"
                          placeholder="House no., street, area and landmark"
                        />
                        {addressErrors.address && (
                          <span className="field-error">
                            {addressErrors.address}
                          </span>
                        )}
                      </label>

                      <label>
                        State

                        <Select
                          options={stateOptions}
                          value={editorSelectedState}
                          placeholder="Search State..."
                          isSearchable
                          onChange={(state) => {
                            setEditorSelectedState(state);
                            setEditorSelectedCity(null);
                            setDraft((current) => ({
                              ...current,
                              state: state?.label || "",
                              city: "",
                            }));
                            if (addressErrors.state || addressErrors.city) {
                              setAddressErrors((current) => ({
                                ...current,
                                state: "",
                                city: "",
                              }));
                            }
                          }}
                        />
                        {addressErrors.state && (
                          <span className="field-error">
                            {addressErrors.state}
                          </span>
                        )}
                      </label>

                      <label>
                        City

                        <Select
                          options={editorCityOptions}
                          value={editorSelectedCity}
                          placeholder="Search City..."
                          isSearchable
                          isDisabled={!editorSelectedState}
                          onChange={(city) => {
                            setEditorSelectedCity(city);
                            setDraft((current) => ({
                              ...current,
                              city: city?.label || "",
                            }));
                            if (addressErrors.city) {
                              setAddressErrors((current) => ({
                                ...current,
                                city: "",
                              }));
                            }
                          }}
                        />
                        {addressErrors.city && (
                          <span className="field-error">
                            {addressErrors.city}
                          </span>
                        )}
                      </label>

                      <label>
                        Pincode

                        <input
                          value={draft.pincode}
                          onChange={(e) =>
                            updateDraft(
                              "pincode",
                              e.target.value.replace(/\D/g, "").slice(0, 6)
                            )
                          }
                          inputMode="numeric"
                          maxLength="6"
                          placeholder="6-digit pincode"
                        />
                        {addressErrors.pincode && (
                          <span className="field-error">
                            {addressErrors.pincode}
                          </span>
                        )}
                      </label>

                      <button
                        type="button"
                        className="primary-button save-address-btn"
                        onClick={saveAddress}
                      >
                        {editingIndex === -1
                          ? "Add address"
                          : "Update address"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="add-address-btn"
                      onClick={() => startEditAddress(-1)}
                    >
                      ＋ Add new address
                    </button>
                  )}

                  {saveSuccess && (
                    <div
                      className="full-field"
                      role="status"
                      style={{
                        padding: "12px 14px",
                        border: "1px solid #a6f4c5",
                        borderRadius: "10px",
                        background: "#ecfdf3",
                        color: "#067647",
                        fontWeight: 700,
                      }}
                    >
                      ✓ Details saved successfully
                    </div>
                  )}

                  <button
                    className="primary-button profile-save"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save details"}
                  </button>
                </form>
              ) : tab === "security" ? (
                <section className="security-panel">
                  <div>
                    <span className="eyebrow blue">LOGIN & SECURITY</span>
                    <h3>Login & security</h3>
                    <p>
                      Edit your login name, email, mobile number and password.
                    </p>
                  </div>

                  {/* Name */}
                  <div className="security-row">
                    <div className="security-meta">
                      <span className="security-key">Name</span>
                      <span className="security-value">{user.name}</span>
                    </div>
                    <button
                      type="button"
                      className="security-edit"
                      onClick={() => startSecEdit("name")}
                    >
                      {securityEdit === "name" ? "Cancel" : "Edit"}
                    </button>
                  </div>
                  {securityEdit === "name" && (
                    <div className="security-editor">
                      <label>
                        Full name
                        <input
                          value={secForm.name}
                          onChange={(e) =>
                            setSecForm((f) => ({ ...f, name: e.target.value }))
                          }
                        />
                      </label>
                      {secFieldErrors.name && (
                        <span className="field-error">
                          {secFieldErrors.name}
                        </span>
                      )}
                      <div className="security-editor-actions">
                        <button
                          type="button"
                          className="primary-button"
                          onClick={saveSecName}
                          disabled={secSubmitting}
                        >
                          {secSubmitting ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* E-mail */}
                  <div className="security-row">
                    <div className="security-meta">
                      <span className="security-key">E-mail</span>
                      <span className="security-value">{user.email}</span>
                    </div>
                    <button
                      type="button"
                      className="security-edit"
                      onClick={() => startSecEdit("email")}
                    >
                      {securityEdit === "email" ? "Cancel" : "Edit"}
                    </button>
                  </div>
                  {securityEdit === "email" && (
                    <div className="security-editor">
                      {!secOtpSent ? (
                        <>
                          <p className="security-hint">
                            Enter your new email address. An OTP will be sent to
                            your current email to confirm the change.
                          </p>
                          <label>
                            New email address
                            <input
                              type="email"
                              value={secForm.newEmail}
                              onChange={(e) =>
                                setSecForm((f) => ({
                                  ...f,
                                  newEmail: e.target.value,
                                }))
                              }
                              placeholder="new@example.com"
                            />
                          </label>
                          {secFieldErrors.newEmail && (
                            <span className="field-error">
                              {secFieldErrors.newEmail}
                            </span>
                          )}
                          <button
                            type="button"
                            className="primary-button"
                            onClick={secRequestOtp}
                            disabled={secSubmitting}
                          >
                            {secSubmitting ? "Sending..." : "Send OTP"}
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="security-hint">
                            OTP sent to <strong>{user.email}</strong>. Enter it
                            below to confirm the change to{" "}
                            <strong>{secForm.newEmail}</strong>.
                          </p>
                          <label>
                            OTP
                            <input
                              value={secForm.otp}
                              onChange={(e) =>
                                setSecForm((f) => ({
                                  ...f,
                                  otp: e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 6),
                                }))
                              }
                              placeholder="6-digit OTP"
                              inputMode="numeric"
                              maxLength="6"
                              autoComplete="one-time-code"
                            />
                          </label>
                          {secFieldErrors.otp && (
                            <span className="field-error">
                              {secFieldErrors.otp}
                            </span>
                          )}
                          <div className="security-editor-actions">
                            <button
                              type="button"
                              className="primary-button"
                              onClick={secVerifyChange}
                              disabled={secSubmitting}
                            >
                              {secSubmitting
                                ? "Verifying..."
                                : "Verify & change email"}
                            </button>
                            <button
                              type="button"
                              className="resend-btn"
                              onClick={secRequestOtp}
                              disabled={resendIn > 0 || secSubmitting}
                            >
                              {resendIn > 0
                                ? `Resend OTP in ${resendIn}s`
                                : "Resend OTP"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Primary mobile number */}
                  <div className="security-row">
                    <div className="security-meta">
                      <span className="security-key">
                        Primary mobile number
                      </span>
                      <span className="security-value">
                        {user.phone ? `+91 ${user.phone}` : "Not added yet"}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="security-edit"
                      onClick={() => startSecEdit("phone")}
                    >
                      {securityEdit === "phone"
                        ? "Cancel"
                        : user.phone
                        ? "Edit"
                        : "Add"}
                    </button>
                  </div>
                  {securityEdit === "phone" && (
                    <div className="security-editor">
                      {!secOtpSent ? (
                        <>
                          <p className="security-hint">
                            Enter your new mobile number. An OTP will be sent to
                            your current email to confirm the change.
                          </p>
                          <label>
                            New mobile number
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength="10"
                              value={secForm.newPhone}
                              onChange={(e) =>
                                setSecForm((f) => ({
                                  ...f,
                                  newPhone: e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 10),
                                }))
                              }
                              placeholder="10-digit mobile number"
                            />
                          </label>
                          {secFieldErrors.newPhone && (
                            <span className="field-error">
                              {secFieldErrors.newPhone}
                            </span>
                          )}
                          <button
                            type="button"
                            className="primary-button"
                            onClick={secRequestOtp}
                            disabled={secSubmitting}
                          >
                            {secSubmitting ? "Sending..." : "Send OTP"}
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="security-hint">
                            OTP sent to <strong>{user.email}</strong>. Enter it
                            below to confirm updating your mobile number to{" "}
                            <strong>+91 {secForm.newPhone}</strong>.
                          </p>
                          <label>
                            OTP
                            <input
                              value={secForm.otp}
                              onChange={(e) =>
                                setSecForm((f) => ({
                                  ...f,
                                  otp: e.target.value
                                    .replace(/\D/g, "")
                                    .slice(0, 6),
                                }))
                              }
                              placeholder="6-digit OTP"
                              inputMode="numeric"
                              maxLength="6"
                              autoComplete="one-time-code"
                            />
                          </label>
                          {secFieldErrors.otp && (
                            <span className="field-error">
                              {secFieldErrors.otp}
                            </span>
                          )}
                          <div className="security-editor-actions">
                            <button
                              type="button"
                              className="primary-button"
                              onClick={secVerifyChange}
                              disabled={secSubmitting}
                            >
                              {secSubmitting
                                ? "Verifying..."
                                : "Verify & update mobile"}
                            </button>
                            <button
                              type="button"
                              className="resend-btn"
                              onClick={secRequestOtp}
                              disabled={resendIn > 0 || secSubmitting}
                            >
                              {resendIn > 0
                                ? `Resend OTP in ${resendIn}s`
                                : "Resend OTP"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Password */}
                  <div className="security-row">
                    <div className="security-meta">
                      <span className="security-key">Password</span>
                      <span className="security-value">••••••••</span>
                    </div>
                    <button
                      type="button"
                      className="security-edit"
                      onClick={() => startSecEdit("password")}
                    >
                      {securityEdit === "password" ? "Cancel" : "Edit"}
                    </button>
                  </div>
                  {securityEdit === "password" && (
                    <div className="security-editor">
                      <p className="security-hint">
                        Verify your current password to set a new one.
                      </p>
                      <label>
                        Current password
                        <input
                          type="password"
                          value={secForm.currentPassword}
                          onChange={(e) =>
                            setSecForm((f) => ({
                              ...f,
                              currentPassword: e.target.value,
                            }))
                          }
                          autoComplete="current-password"
                        />
                      </label>
                      {secFieldErrors.currentPassword && (
                        <span className="field-error">
                          {secFieldErrors.currentPassword}
                        </span>
                      )}
                      <label>
                        New password
                        <input
                          type="password"
                          value={secForm.newPassword}
                          onChange={(e) =>
                            setSecForm((f) => ({
                              ...f,
                              newPassword: e.target.value,
                            }))
                          }
                          autoComplete="new-password"
                          placeholder="Minimum 8 characters"
                        />
                      </label>
                      {secFieldErrors.newPassword && (
                        <span className="field-error">
                          {secFieldErrors.newPassword}
                        </span>
                      )}
                      <label>
                        Re-enter new password
                        <input
                          type="password"
                          value={secForm.confirmPassword}
                          onChange={(e) =>
                            setSecForm((f) => ({
                              ...f,
                              confirmPassword: e.target.value,
                            }))
                          }
                          autoComplete="new-password"
                        />
                      </label>
                      {secFieldErrors.confirmPassword && (
                        <span className="field-error">
                          {secFieldErrors.confirmPassword}
                        </span>
                      )}
                      <div className="security-editor-actions">
                        <button
                          type="button"
                          className="primary-button"
                          onClick={changePassword}
                          disabled={secSubmitting}
                        >
                          {secSubmitting ? "Saving..." : "Save new password"}
                        </button>
                      </div>
                    </div>
                  )}

                  {secError && (
                    <div role="alert" className="security-error">
                      {secError}
                    </div>
                  )}
                </section>
              ) : (
                <section className="orders-panel">
                  <div>
                    <span className="eyebrow blue">
                      ORDER HISTORY
                    </span>
                    <h3>My orders</h3>
                    <p>
                      Orders placed while logged in will appear here.
                    </p>
                  </div>

                  {loadingOrders ? (
                    <div className="account-empty">
                      Loading your orders...
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="account-empty">
                      You have not placed an order from this account yet.
                    </div>
                  ) : (
                    <div className="order-history-list">
                      {orders.map((order) => (
                        <article
                          className="history-order"
                          key={order._id}
                        >
                          <header>
                            <div>
                              <b>{order.orderNumber}</b>
                              <small>
                                {new Date(
                                  order.createdAt
                                ).toLocaleString("en-IN")}
                              </small>
                            </div>

                            <span
                              className={`order-status status-${order.orderStatus}`}
                            >
                              {statusLabel(order.orderStatus)}
                            </span>
                          </header>

                          <OrderTimeline order={order} />

                          <div className="history-items">
                            {order.items?.map((item) => (
                              <div key={item._id || item.product}>
                                <img
                                  src={
                                    optimizeImage(item.image, 200) ||
                                    "https://placehold.co/60x60?text=Product"
                                  }
                                  alt={item.title || "Product"}
                                  loading="lazy"
                                  decoding="async"
                                />

                                <span>
                                  {item.title}
                                  <small>
                                    {item.quantity} × ₹{item.price}
                                  </small>
                                </span>
                              </div>
                            ))}
                          </div>

                          <footer>
                            <span>
                              {order.paymentMethod === "razorpay"
                                ? "Paid Online"
                                : order.deliveryChargePaid
                                ? "COD — Delivery Paid"
                                : "Cash on Delivery"}
                            </span>
                            <b>Total ₹{order.totalAmount}</b>
                          </footer>

                          {(() => {
                            const returnInfo = returnInfoFor(order);

                            if (returnInfo) {
                              return (
                                <div
                                  className={`return-status return-${returnInfo.status}`}
                                >
                                  {returnInfo.status === "pending"
                                    ? "🔄 Return requested — under review (1-2 days)"
                                    : returnInfo.status === "approved"
                                    ? `✅ Refund approved — ₹${
                                        returnInfo.refundAmount || 0
                                      } will be sent to your UPI`
                                    : "❌ Return request was not approved"}
                                </div>
                              );
                            }

                            if (!canReturnOrder(order)) {
                              return (
                                <div className="return-status return-expired">
                                  ⌛ Return window closed (7 days from placing
                                  your order)
                                </div>
                              );
                            }

                            return (
                              <>
                                <button
                                  type="button"
                                  className="return-open-btn"
                                  onClick={() =>
                                    setReturnOrderId(
                                      returnOrderId === order._id
                                        ? null
                                        : order._id
                                    )
                                  }
                                >
                                  🔄 Return / Refund
                                </button>

                                {returnOrderId === order._id && (
                                  <form
                                    className="return-form"
                                    onSubmit={submitReturn}
                                  >
                                    <div className="return-form-head">
                                      <b>Return this order</b>
                                      <small>
                                        You can return within 7 days of
                                        placing your order — just like
                                        Amazon.
                                      </small>
                                    </div>

                                    <label>
                                      Return reason
                                      <select
                                        value={returnReason}
                                        onChange={(e) => {
                                          setReturnReason(e.target.value);
                                          if (returnErrors.reason) {
                                            setReturnErrors((c) => ({
                                              ...c,
                                              reason: "",
                                            }));
                                          }
                                        }}
                                      >
                                        <option value="">
                                          Select a reason...
                                        </option>
                                        {RETURN_REASONS.map((reason) => (
                                          <option key={reason} value={reason}>
                                            {reason}
                                          </option>
                                        ))}
                                      </select>
                                      {returnErrors.reason && (
                                        <span className="field-error">
                                          {returnErrors.reason}
                                        </span>
                                      )}
                                    </label>

                                    <label>
                                      Describe the issue (optional)
                                      <textarea
                                        rows="2"
                                        value={returnDescription}
                                        onChange={(e) =>
                                          setReturnDescription(e.target.value)
                                        }
                                        placeholder="e.g. The product arrived damaged..."
                                      />
                                    </label>

                                    <label>
                                      Photos of the product (up to 5)
                                      <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={(e) =>
                                          setReturnImages([
                                            ...e.target.files,
                                          ].slice(0, 5))
                                        }
                                      />
                                      {returnImages.length > 0 && (
                                        <small className="return-files-note">
                                          📎 {returnImages.length} photo(s)
                                          selected
                                        </small>
                                      )}
                                    </label>

                                    <label>
                                      Video proof (optional)
                                      <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) =>
                                          setReturnVideo(
                                            e.target.files[0] || null
                                          )
                                        }
                                      />
                                      {returnVideo && (
                                        <small className="return-files-note">
                                          🎬 {returnVideo.name}
                                        </small>
                                      )}
                                    </label>

                                    <label>
                                      UPI ID for refund
                                      <input
                                        value={returnUpi}
                                        onChange={(e) => {
                                          setReturnUpi(e.target.value);
                                          if (returnErrors.upi) {
                                            setReturnErrors((c) => ({
                                              ...c,
                                              upi: "",
                                            }));
                                          }
                                        }}
                                        placeholder="yourname@upi"
                                        autoComplete="off"
                                      />
                                      {returnErrors.upi ? (
                                        <span className="field-error">
                                          {returnErrors.upi}
                                        </span>
                                      ) : (
                                        <small>
                                          Your refund will be sent to this UPI
                                          ID once approved.
                                        </small>
                                      )}
                                    </label>

                                    <div className="return-refund-box">
                                      <b>Refund breakdown</b>
                                      <div className="return-refund-row">
                                        <span>Order total</span>
                                        <span>₹{order.totalAmount}</span>
                                      </div>
                                      <div className="return-refund-row minus">
                                        <span>
                                          Shipping fee (non-refundable)
                                        </span>
                                        <span>
                                          - ₹{Number(order.deliveryFee) || 0}
                                        </span>
                                      </div>
                                      <div className="return-refund-total">
                                        <span>
                                          Total amount to be refunded after
                                          approval
                                        </span>
                                        <b>
                                          ₹
                                          {Math.max(
                                            0,
                                            Number(order.totalAmount) -
                                              (Number(order.deliveryFee) || 0)
                                          )}
                                        </b>
                                      </div>
                                    </div>

                                    <label className="return-confirm">
                                      <input
                                        type="checkbox"
                                        checked={returnConfirm}
                                        onChange={(e) => {
                                          setReturnConfirm(e.target.checked);
                                          if (returnErrors.confirm) {
                                            setReturnErrors((c) => ({
                                              ...c,
                                              confirm: "",
                                            }));
                                          }
                                        }}
                                      />
                                      <span>
                                        I understand that the shipping fee
                                        (₹{Number(order.deliveryFee) || 0}) is
                                        not refundable, and the final refund
                                        amount will be confirmed after approval.
                                      </span>
                                    </label>
                                    {returnErrors.confirm && (
                                      <span className="field-error">
                                        {returnErrors.confirm}
                                      </span>
                                    )}

                                    <button
                                      type="submit"
                                      className="return-submit-btn"
                                      disabled={returnSubmitting}
                                    >
                                      {returnSubmitting
                                        ? "Submitting..."
                                        : "✓ Confirm & submit return request"}
                                    </button>
                                  </form>
                                )}
                              </>
                            );
                          })()}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}