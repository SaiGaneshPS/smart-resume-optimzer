import Joi from 'joi';

export const updateProfileSchema = Joi.object({
    firstName: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Please enter your first name',
            'string.min': 'First name must be at least 2 characters',
            'string.max': 'First name must be less than 50 characters',
            'any.required': 'First name is required'
        }),
    lastName: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.empty': 'Please enter your last name',
            'string.min': 'Last name must be at least 2 characters',
            'string.max': 'Last name must be less than 50 characters',
            'any.required': 'Last name is required'
        }),
    // Password validation changed to avoid circular dependency
    currentPassword: Joi.string()
        .min(8)
        .allow('')
        .optional()
        .messages({
            'string.min': 'Current password must be at least 8 characters'
        }),
    newPassword: Joi.string()
        .min(8)
        .allow('')
        .optional()
        .messages({
            'string.min': 'New password must be at least 8 characters'
        })
}).custom((value, helpers) => {
    // Custom validation for password changes
    if ((value.currentPassword && !value.newPassword) || 
        (!value.currentPassword && value.newPassword)) {
        return helpers.error('object.passwordMismatch');
    }
    if (value.currentPassword === '' && value.newPassword === '') {
        // Both empty is fine - no password change requested
        return value;
    }
    if (value.currentPassword && value.newPassword) {
        // Both provided is fine - password change requested
        return value;
    }
    return value;
}).messages({
    'object.passwordMismatch': 'Both current password and new password must be provided to change password'
});