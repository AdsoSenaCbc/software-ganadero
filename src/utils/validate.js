// src/utils/validate.js
/**
 * Generic validation helper.
 * @param {Object} schema  { fieldName: { required:boolean, message:string, number?:boolean } }
 * @param {Object} values  Form data.
 * @returns {Object} errors where key is fieldName and value is message.
 */
export const validate = (schema, values) => {
  const errors = {};
  Object.entries(schema).forEach(([field, rules]) => {
    const val = values[field];
    if (rules.required && (val === undefined || val === null || val === '' || (typeof val === 'string' && !val.trim()))) {
      errors[field] = rules.message || 'Campo requerido';
    }
    if (rules.number && val && isNaN(val)) {
      errors[field] = 'Debe ser numérico';
    }
  });
  return errors;
};
