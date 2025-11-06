declare module 'react-hook-form' {
  import * as React from 'react';
  
  export interface UseFormReturn<T extends Record<string, any> = Record<string, any>> {
    control: any;
    handleSubmit: (onSubmit: (data: T) => void) => (e?: React.BaseSyntheticEvent) => Promise<void>;
    formState: any;
    register: any;
    watch: any;
    setValue: any;
    getValues: any;
    reset: any;
    getFieldState: (name: string, formState?: any) => any;
  }
  
  export function useForm<T extends Record<string, any> = Record<string, any>>(
    options?: any
  ): UseFormReturn<T>;
  
  export const Controller: React.ComponentType<any>;
  export const FormProvider: React.ComponentType<any>;
  export function useFormContext<T extends Record<string, any> = Record<string, any>>(): UseFormReturn<T>;
  export function useFormState<T extends Record<string, any> = Record<string, any>>(options?: any): any;
  
  export type ControllerProps<TFieldValues extends Record<string, any> = Record<string, any>, TName extends string = string> = any;
  export type FieldPath<T extends Record<string, any>> = string;
  export type FieldValues = Record<string, any>;
}


