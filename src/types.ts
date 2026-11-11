export type Status = 'Active' | 'Partially paid' | 'Paid' | 'Expired';
export type StatusFilter = 'All' | Status;

export interface PaymentLink {
  id: string;
  amountPaise: number; // integer paise avoids float errors
  description: string;
  email?: string;
  phone?: string;
  expiresAt?: number; // epoch ms
  allowPartialPayments: boolean;
  minimumFirstPaymentPaise?: number;
  amountPaidPaise: number;
  createdAt: number; // epoch ms
}

export interface FormInput {
  amount: string;
  description: string;
  email: string;
  phone: string;
  expiry: string; // value from <input type="datetime-local">
  allowPartialPayments: boolean;
  minimumFirstPayment: string;
}

export type FormErrors = Partial<
  Record<'amount' | 'description' | 'contact' | 'expiry' | 'minimumFirstPayment', string>
>;
