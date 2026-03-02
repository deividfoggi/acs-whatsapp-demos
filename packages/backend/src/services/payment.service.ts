import {
  Fee,
  FeeStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "../types/index.js";
import { MOCK_FEES, MOCK_PAYMENTS } from "../data/mock-data.js";

/**
 * Retrieves all outstanding (non-paid) fees for a student.
 * @param studentId - The student's unique identifier
 * @returns Array of pending or overdue fees
 */
export async function getOutstandingFeesByStudentId(
  studentId: string
): Promise<Fee[]> {
  return MOCK_FEES.filter(
    (f) => f.studentId === studentId && f.status !== FeeStatus.Paid
  );
}

/**
 * Retrieves all fees for a student (including paid).
 * @param studentId - The student's unique identifier
 * @returns Array of all fees for the student
 */
export async function getAllFeesByStudentId(
  studentId: string
): Promise<Fee[]> {
  return MOCK_FEES.filter((f) => f.studentId === studentId);
}

/**
 * Retrieves a single fee by ID.
 * @param feeId - The fee's unique identifier
 * @returns The fee if found, or undefined
 */
export async function getFeeById(feeId: string): Promise<Fee | undefined> {
  return MOCK_FEES.find((f) => f.id === feeId);
}

/**
 * Processes a payment against a fee (dummy implementation).
 * Always succeeds — marks the fee as paid and records the payment.
 * @param studentId - The student's unique identifier
 * @param feeId - The fee being paid
 * @param amount - Payment amount
 * @param method - Payment method
 * @returns The created payment record
 */
export async function processPayment(
  studentId: string,
  feeId: string,
  amount: number,
  method: PaymentMethod
): Promise<Payment> {
  const paymentId = `pay_${String(MOCK_PAYMENTS.length + 1).padStart(3, "0")}`;

  const payment: Payment = {
    id: paymentId,
    studentId,
    feeId,
    amount,
    method,
    timestamp: new Date().toISOString(),
    status: PaymentStatus.Completed,
  };

  // Add payment to in-memory store
  MOCK_PAYMENTS.push(payment);

  // Mark the fee as paid
  const fee = MOCK_FEES.find((f) => f.id === feeId);
  if (fee) {
    fee.status = FeeStatus.Paid;
  }

  return payment;
}

/**
 * Retrieves payment history for a student.
 * @param studentId - The student's unique identifier
 * @returns Array of payments made for that student
 */
export async function getPaymentsByStudentId(
  studentId: string
): Promise<Payment[]> {
  return MOCK_PAYMENTS.filter((p) => p.studentId === studentId);
}
