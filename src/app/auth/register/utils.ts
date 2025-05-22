'use client';

/**
 * Validates an email address
 * @param email The email address to validate
 * @returns An object with isValid boolean and error message if invalid
 */
export function check_email(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'L\'email est requis' };
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Format d\'email invalide' };
  }

  // Check for common disposable email domains
  const disposableDomains = [
    'yopmail.com', 'tempmail.com', 'temp-mail.org', 'guerrillamail.com', 
    'mailinator.com', '10minutemail.com', 'throwawaymail.com', 'trashmail.com',
    'sharklasers.com', 'guerrillamail.info', 'grr.la', 'spam4.me'
  ];
  
  const domain = email.split('@')[1].toLowerCase();
  if (disposableDomains.includes(domain)) {
    return { isValid: false, error: 'Les emails temporaires ne sont pas acceptés' };
  }

  // Check for common email patterns that might indicate spam
  if (email.includes('+')) {
    return { isValid: false, error: 'Les emails avec le caractère "+" ne sont pas acceptés' };
  }

  return { isValid: true };
}
