// src/utils/accountStatusHandler.js

const ACCOUNT_STATUS_STORAGE_KEY = "openshare_account_status_notice";

const BLOCKED_STATUS_KEYWORDS = [
  "suspended",
  "disabled",
  "banned",
  "restricted",
  "account has been suspended",
  "account is temporarily suspended",
  "account has been disabled",
  "account has been banned",
  "account is restricted",
];

export function clearAuthStorage() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("user");
}

export function getAccountStatusMessage(errorOrResponseData) {
  const data = errorOrResponseData?.response?.data || errorOrResponseData || {};

  const rawMessage =
    data.message ||
    data.error ||
    data.reason ||
    data.statusMessage ||
    "";

  if (Array.isArray(rawMessage)) {
    return rawMessage.join(" ");
  }

  return String(rawMessage || "");
}

export function isAccountStatusBlock(errorOrResponseData) {
  const statusCode =
    errorOrResponseData?.response?.status ||
    errorOrResponseData?.status ||
    errorOrResponseData?.statusCode;

  const message = getAccountStatusMessage(errorOrResponseData).toLowerCase();

  if (statusCode !== 403) return false;

  return BLOCKED_STATUS_KEYWORDS.some((keyword) =>
    message.includes(keyword.toLowerCase())
  );
}

export function saveAccountStatusNotice(errorOrResponseData) {
  const data = errorOrResponseData?.response?.data || errorOrResponseData || {};

  const notice = {
    status:
      data.accountStatus ||
      data.status ||
      inferStatusFromMessage(getAccountStatusMessage(errorOrResponseData)),
    message:
      getAccountStatusMessage(errorOrResponseData) ||
      "Your account is currently restricted.",
    suspendedUntil: data.suspendedUntil || null,
    timestamp: new Date().toISOString(),
  };

  sessionStorage.setItem(ACCOUNT_STATUS_STORAGE_KEY, JSON.stringify(notice));

  return notice;
}

export function getAccountStatusNotice() {
  try {
    const raw = sessionStorage.getItem(ACCOUNT_STATUS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAccountStatusNotice() {
  sessionStorage.removeItem(ACCOUNT_STATUS_STORAGE_KEY);
}

export function handleAccountStatusBlock(errorOrResponseData) {
  if (!isAccountStatusBlock(errorOrResponseData)) {
    return false;
  }

  saveAccountStatusNotice(errorOrResponseData);
  clearAuthStorage();

  const currentPath = window.location.pathname;

  if (currentPath !== "/account-status") {
    window.location.assign("/account-status");
  }

  return true;
}

function inferStatusFromMessage(message) {
  const lower = String(message || "").toLowerCase();

  if (lower.includes("suspended")) return "suspended";
  if (lower.includes("disabled")) return "disabled";
  if (lower.includes("banned")) return "banned";
  if (lower.includes("restricted")) return "restricted";

  return "restricted";
}
