export const ADMIN_EMAIL = 'learn.grapinz@gmail.com';

export const isUserAdmin = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};
