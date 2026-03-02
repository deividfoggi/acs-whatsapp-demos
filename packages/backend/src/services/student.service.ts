import { Student } from "../types/index.js";
import { MOCK_STUDENTS } from "../data/mock-data.js";

/**
 * Retrieves all students associated with a parent's phone number.
 * @param phone - Parent phone number in E.164 format
 * @returns Array of students belonging to that parent
 */
export async function getStudentsByParentPhone(
  phone: string
): Promise<Student[]> {
  return MOCK_STUDENTS.filter((s) => s.parentPhone === phone);
}

/**
 * Retrieves a single student by ID.
 * @param studentId - The student's unique identifier
 * @returns The student if found, or undefined
 */
export async function getStudentById(
  studentId: string
): Promise<Student | undefined> {
  return MOCK_STUDENTS.find((s) => s.id === studentId);
}
