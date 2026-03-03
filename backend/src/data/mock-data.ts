import {
  Student,
  Fee,
  FeeStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "../types/index.js";

/**
 * In-memory mock students for Contoso Education.
 * Contoso Education is part of the Contoso Group — an elementary and high
 * school network with 27 units across the country and 45 years of history.
 *
 * Three parents, each with 2 students across different Contoso Education units.
 */
export const MOCK_STUDENTS: Student[] = [
  {
    id: "stu_001",
    name: "Lucas Oliveira",
    grade: "5th Grade",
    parentPhone: "+5511999990001",
    schoolName: "Contoso Education - Unidade Centro",
  },
  {
    id: "stu_002",
    name: "Isabella Oliveira",
    grade: "9th Grade",
    parentPhone: "+5511999990001",
    schoolName: "Contoso Education - Unidade Centro",
  },
  {
    id: "stu_003",
    name: "Gabriel Ferreira",
    grade: "3rd Grade",
    parentPhone: "+5511999990002",
    schoolName: "Contoso Education - Unidade Jardins",
  },
  {
    id: "stu_004",
    name: "Sophia Ferreira",
    grade: "11th Grade",
    parentPhone: "+5511999990002",
    schoolName: "Contoso Education - Unidade Jardins",
  },
  {
    id: "stu_005",
    name: "Miguel Costa",
    grade: "7th Grade",
    parentPhone: "+5511999990003",
    schoolName: "Contoso Education - Unidade Alphaville",
  },
  {
    id: "stu_006",
    name: "Helena Costa",
    grade: "2nd Grade",
    parentPhone: "+5511999990003",
    schoolName: "Contoso Education - Unidade Alphaville",
  },
];

/**
 * In-memory mock fees for Contoso Education students.
 * Mix of pending, overdue, and paid fees across different categories.
 */
export const MOCK_FEES: Fee[] = [
  {
    id: "fee_001",
    studentId: "stu_001",
    description: "March 2026 Tuition",
    amount: 1450.0,
    dueDate: "2026-03-10",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_002",
    studentId: "stu_001",
    description: "Materials Fee - Semester 1",
    amount: 380.0,
    dueDate: "2026-02-15",
    status: FeeStatus.Overdue,
  },
  {
    id: "fee_003",
    studentId: "stu_002",
    description: "March 2026 Tuition",
    amount: 1750.0,
    dueDate: "2026-03-10",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_004",
    studentId: "stu_002",
    description: "Field Trip - Museu do Ipiranga",
    amount: 95.0,
    dueDate: "2026-03-20",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_005",
    studentId: "stu_003",
    description: "March 2026 Tuition",
    amount: 1450.0,
    dueDate: "2026-03-10",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_006",
    studentId: "stu_004",
    description: "March 2026 Tuition",
    amount: 1950.0,
    dueDate: "2026-03-10",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_007",
    studentId: "stu_004",
    description: "Lab Fee - Chemistry",
    amount: 220.0,
    dueDate: "2026-02-28",
    status: FeeStatus.Overdue,
  },
  {
    id: "fee_008",
    studentId: "stu_001",
    description: "February 2026 Tuition",
    amount: 1450.0,
    dueDate: "2026-02-10",
    status: FeeStatus.Paid,
  },
  {
    id: "fee_009",
    studentId: "stu_005",
    description: "March 2026 Tuition",
    amount: 1600.0,
    dueDate: "2026-03-10",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_010",
    studentId: "stu_005",
    description: "Sports Fee - Swimming",
    amount: 180.0,
    dueDate: "2026-03-05",
    status: FeeStatus.Overdue,
  },
  {
    id: "fee_011",
    studentId: "stu_006",
    description: "March 2026 Tuition",
    amount: 1350.0,
    dueDate: "2026-03-10",
    status: FeeStatus.Pending,
  },
  {
    id: "fee_012",
    studentId: "stu_002",
    description: "February 2026 Tuition",
    amount: 1750.0,
    dueDate: "2026-02-10",
    status: FeeStatus.Paid,
  },
];

/**
 * In-memory mock payments for Contoso Education.
 * Starts with completed payments to show history.
 */
export const MOCK_PAYMENTS: Payment[] = [
  {
    id: "pay_001",
    studentId: "stu_001",
    feeId: "fee_008",
    amount: 1450.0,
    method: PaymentMethod.Pix,
    timestamp: "2026-02-08T14:30:00Z",
    status: PaymentStatus.Completed,
  },
  {
    id: "pay_002",
    studentId: "stu_002",
    feeId: "fee_012",
    amount: 1750.0,
    method: PaymentMethod.CreditCard,
    timestamp: "2026-02-09T10:15:00Z",
    status: PaymentStatus.Completed,
  },
];
