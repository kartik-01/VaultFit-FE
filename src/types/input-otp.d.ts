declare module 'input-otp' {
  import * as React from 'react';
  
  export interface OTPInputContextValue {
    slots?: Array<{
      char?: string;
      hasFakeCaret?: boolean;
      isActive?: boolean;
    }>;
  }
  
  export const OTPInputContext: React.Context<OTPInputContextValue | undefined>;
  
  export interface OTPInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    maxLength?: number;
    value?: string;
    onChange?: (value: string) => void;
    containerClassName?: string;
  }
  
  export const OTPInput: React.ComponentType<OTPInputProps>;
}


