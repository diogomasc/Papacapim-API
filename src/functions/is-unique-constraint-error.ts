export function isUniqueConstraintError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error.message || "";
  const errorString = JSON.stringify(error);

  return (
    (error.code && String(error.code) === "23505") ||
    errorMessage.includes("duplicate key") ||
    errorMessage.includes("users_login_unique") ||
    errorMessage.includes("users_login_key") ||
    errorString.includes("users_login_unique") ||
    errorString.includes("users_login_key") ||
    error.routine === "_bt_check_unique"
  );
}
