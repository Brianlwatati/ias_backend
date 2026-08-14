// src/modules/transactions/transaction.types.ts

export type TransactionType = "PAYMENT" | "REFUND" | "CREDIT" | "DEBIT" | "ADJUSTMENT";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED" | "REFUNDED";

export interface Transaction {
  id: number;
  companyId: number;
  subscriptionId: number | null;
  transactionReference: string;
  transactionType: TransactionType;
  amount: string;
  currency: string;
  status: TransactionStatus;
  paymentMethod: string | null;
  externalTransactionId: string | null;
  transactionDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
