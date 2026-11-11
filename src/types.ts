export type Status = 'Active' | 'Paid' | 'Expired';
export type StatusFilter = 'All' | Status;

export interface PaymentLink {
  id: string;
  amountPaise: number; // integer paise avoids float errors
  description: string;
  email?: string;
  phone?: string;
  expiresAt?: number; // epoch ms
  paid: boolean;
  createdAt: number; // epoch ms
}

export interface FormInput {
  amount: string;
  description: string;
  email: string;
  phone: string;
  expiry: string; // value from <input type="datetime-local">
}

export type FormErrors = Partial<Record<'amount' | 'description' | 'contact' | 'expiry', string>>;
