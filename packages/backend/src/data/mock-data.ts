import {
  Student,
  Fee,
  FeeStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "../types/index.js";

/**
 * In-memory mock students for TheFoggi Consultancy.
 * Two parents, each with 2 students across different schools.
 */
export const MOCK_STUDENTS: Student[] = [
  {
    id: "stu_001",
    name: "Lucas Silva",
    grade: "5th Grade",
    parentPhone: "+5511999990001",
    schoolName: "TheFoggi Elementary",
  },
  {
    id: "stu_002",
    name: "Maria Silva",
    grade: "8th Grade",
    parentPhone: "+5511999990001",
    schoolName: "TheFoggi Middle School",
  },
  {
    id: "stu_003",
    name: "Pedro Santos",
    grade: "3rd Grade",
    parentPhone: "+5511999990002",
    schoolName: "TheFoggi Elementary",
  },
  {
    id: "stu_004",
    name: "Ana Santos",
    grade: "11th Grade",
    parentPhone: "+5511999990002",
    schoolName: "TheFoggi High School",
  },
];

/**
 * In-memory mock fees for students.
 * Mix of pending, overdue, and paid fees.
 */
export const MOCK_FEES: Fee[] = [
  {
    id: "fee_001",
    studentId: "stu_001",
    description: "March 2026 Tuition",
    amount: 1200.0,
    dueDate: "2026-03-10",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_002",
    studentId: "stu_001",
    description: "Materials Fee - Semester 1",
    amount: 350.0,
    dueDate: "2026-02-15",
    status: FeeStatus.Overdue,
  },
  {
    id: "fee_003",
    studentId: "stu_002",
    description: "March 2026 Tuition",
    amount: 1500.0,
    dueDate: "2026-03-10",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_004",
    studentId: "stu_002",
    description: "Field Trip - Science Museum",
    amount: 85.0,
    dueDate: "2026-03-20",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_005",
    studentId: "stu_003",
    description: "March 2026 Tuition",
    amount: 1200.0,
    dueDate: "2026-03-10",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_006",
    studentId: "stu_004",
    description: "March 2026 Tuition",
    amount: 1800.0,
    dueDate: "2026-03-10",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_007",
    studentId: "stu_004",
    description: "Lab Fee - Chemistry",
    amount: 200.0,
    dueDate: "2026-02-28",
    status: FeeStatus.Overdue,
  },
  {
    id: "fee_008",
    studentId: "stu_001",
    description: "February 2026 Tuition",
    amount: 1200.0,
    dueDate: "2026-02-10",
    status: FeeStatus.Paid,
  },
];

/**
 * In-memory mock payments.
 * Starts with one completed payment to show history.
 */
export const MOCK_PAYMENTS: Payment[] = [
  {
    id: "pay_001",
    studentId: "stu_001",
    feeId: "fee_008",
    amount: 1200.0,
    method: PaymentMethod.Pix,
    timestamp: "2026-02-08T14:30:00Z",
    status: PaymentStatus.Completed,
  },
];
