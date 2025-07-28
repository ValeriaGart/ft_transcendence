export interface NicknameValidation {
  isValid: boolean;
  errors: string[];
}

export interface NicknameSuggestion {
  suggestion: string;
  baseNickname: string;
}

export class NicknameUtils {
  private static readonly RESERVED_NAMES = ['admin', 'root', 'system', 'guest', 'anonymous', 'null', 'undefined'];
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 20;
  private static readonly VALID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

  /**
   * Validate nickname format on the frontend
   */
  static validateNickname(nickname: string): NicknameValidation {
    const errors: string[] = [];

    if (!nickname || typeof nickname !== 'string') {
      errors.push('Nickname is required');
      return { isValid: false, errors };
    }

    if (nickname.length < this.MIN_LENGTH) {
      errors.push(`Nickname must be at least ${this.MIN_LENGTH} characters long`);
    }

    if (nickname.length > this.MAX_LENGTH) {
      errors.push(`Nickname must be no more than ${this.MAX_LENGTH} characters long`);
    }

    if (!this.VALID_PATTERN.test(nickname)) {
      errors.push('Nickname can only contain letters, numbers, underscores, and hyphens, and must start with a letter or number');
    }

    // Check for reserved names
    if (this.RESERVED_NAMES.includes(nickname.toLowerCase())) {
      errors.push('This nickname is reserved and cannot be used');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean nickname by removing special characters and formatting
   */
  static cleanNickname(nickname: string): string {
    if (!nickname || typeof nickname !== 'string') {
      return '';
    }

    // Remove special characters, keep only alphanumeric, underscore, and hyphen
    let cleaned = nickname.replace(/[^a-zA-Z0-9_-]/g, '');

    // Ensure it starts with a letter or number
    if (!/^[a-zA-Z0-9]/.test(cleaned)) {
      cleaned = 'user' + cleaned;
    }

    // Limit length
    if (cleaned.length < this.MIN_LENGTH) {
      cleaned = cleaned + '1';
    }
    if (cleaned.length > this.MAX_LENGTH) {
      cleaned = cleaned.substring(0, this.MAX_LENGTH);
    }

    return cleaned;
  }

  /**
   * Generate nickname suggestions based on input
   */
  static generateSuggestions(baseNickname: string): string[] {
    const cleaned = this.cleanNickname(baseNickname);
    const suggestions: string[] = [];

    // Generate variations
    for (let i = 1; i <= 5; i++) {
      const suggestion = `${cleaned}${i}`;
      if (suggestion.length <= this.MAX_LENGTH) {
        suggestions.push(suggestion);
      }
    }

    // Add some creative variations
    const creativeSuffixes = ['_gamer', '_player', '_pro', '_2024', '_x'];
    creativeSuffixes.forEach(suffix => {
      const suggestion = `${cleaned}${suffix}`;
      if (suggestion.length <= this.MAX_LENGTH) {
        suggestions.push(suggestion);
      }
    });

    return suggestions.slice(0, 5); // Return max 5 suggestions
  }

  /**
   * Get nickname suggestions from backend
   */
  static async getBackendSuggestions(baseNickname: string): Promise<string[]> {
    try {
      const response = await fetch(`/api/profiles/suggest-nickname?baseNickname=${encodeURIComponent(baseNickname)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting nickname suggestions:', error);
      // Fallback to frontend suggestions
      return this.generateSuggestions(baseNickname);
    }
  }

  /**
   * Check if nickname is available (frontend validation only)
   */
  static async checkNicknameAvailability(nickname: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/profiles/check-nickname?nickname=${encodeURIComponent(nickname)}`);
      
      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.available || false;
    } catch (error) {
      console.error('Error checking nickname availability:', error);
      return false;
    }
  }

  /**
   * Format nickname for display
   */
  static formatNickname(nickname: string): string {
    if (!nickname) return '';
    
    // Capitalize first letter of each word
    return nickname
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Generate nickname from user data
   */
  static generateFromUserData(userData: {
    name?: string;
    email?: string;
    googleName?: string;
  }): string {
    let baseNickname = '';

    // Priority order: provided name > Google name > email prefix
    if (userData.name && userData.name.trim()) {
      baseNickname = userData.name.trim();
    } else if (userData.googleName && userData.googleName.trim()) {
      baseNickname = userData.googleName.trim();
    } else if (userData.email) {
      baseNickname = userData.email.split('@')[0];
    } else {
      baseNickname = 'user';
    }

    return this.cleanNickname(baseNickname);
  }

  /**
   * Debounced nickname validation for real-time feedback
   */
  static createDebouncedValidator(delay: number = 500) {
    let timeoutId: NodeJS.Timeout | null = null;

    return (nickname: string, callback: (validation: NicknameValidation) => void) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        const validation = this.validateNickname(nickname);
        callback(validation);
      }, delay);
    };
  }
} 