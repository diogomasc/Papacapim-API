export function isUniqueConstraintError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message || "";
  const errorString = JSON.stringify(error);

  return (
    (error.code && String(error.code) === "23505") ||
    errorMessage.includes("duplicate key") ||
    errorMessage.includes("users_login_unique") ||
    errorMessage.includes("users_login_key") ||
    errorMessage.includes("unique_follow") ||
    errorMessage.includes("unique_like") ||
    errorString.includes("users_login_unique") ||
    errorString.includes("users_login_key") ||
    errorString.includes("unique_follow") ||
    errorString.includes("unique_like") ||
    error.routine === "_bt_check_unique"
  );
}
