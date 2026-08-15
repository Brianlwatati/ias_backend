// src/modules/subscriptions/subscription.types.ts

export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED"
  | "EXPIRED";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "OVERPAID";

export interface Subscription {
  id: number;
  companyProductId: number;
  companyId: number;
  companyName?: string;
  companyCode?: string;
  productId?: number;
  productName?: string;
  productCode?: string;
  status: SubscriptionStatus;
  amount: string;
  currency: string;
  startsAt: string;
  endsAt: string;
  autoRenew: boolean;
  paymentStatus: PaymentStatus;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}
