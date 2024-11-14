import { AsYouType, ParseError, parsePhoneNumber } from 'libphonenumber-js';

export default function useValidation() {
  function validatePhoneNumber(value = '') {
    let newValue = value;
    try {
      newValue = new AsYouType('US').input(value);
    } catch {
      return { newValue: value, valid: false };
    }

    let phoneNumber;
    try {
      phoneNumber = parsePhoneNumber(newValue, 'US');
    } catch (error) {
      if (error instanceof ParseError) {
        return { newValue, valid: false };
      }
      // Handle other potential errors if necessary
      return { newValue, valid: false };
    }

    // Check if the parsed phone number is valid
    return phoneNumber && phoneNumber.isValid()
      ? { newValue, valid: true }
      : { newValue, valid: false };
  }

  return {
    validatePhoneNumber,
  };
}
