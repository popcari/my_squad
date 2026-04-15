import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isHalfStep', async: false })
class IsHalfStepConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'number' || Number.isNaN(value)) return false;
    return Math.abs(value * 2 - Math.round(value * 2)) < 1e-9;
  }

  defaultMessage(): string {
    return 'rating must be a multiple of 0.5';
  }
}

export function IsHalfStep(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsHalfStepConstraint,
    });
  };
}
