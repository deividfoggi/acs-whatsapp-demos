import type { PredefinedTemplate } from "../types/index.js";

/**
 * Predefined WhatsApp template definitions.
 *
 * These describe the templates that should be pre-created in the Meta WhatsApp
 * Business Manager. The definitions here drive the demo UI — they map display-
 * friendly labels to the exact parameter `refValue` names required by the ACS SDK.
 *
 * NOTE: The `sample_shipping_confirmation` template is a Meta-provided sample
 * that ships pre-created with every WhatsApp Business Account. It is included
 * as a reliable fallback for testing.
 */
export const PREDEFINED_TEMPLATES: readonly PredefinedTemplate[] = [
  {
    id: "enrollment_confirmation",
    displayName: "Enrollment Confirmation",
    description:
      "Confirma a matrícula de um aluno em um curso. " +
      "Enviado após o registro bem-sucedido.",
    templateName: "enrollment_confirmation",
    language: "pt_BR",
    parameterDefinitions: [
      {
        name: "customer_name",
        label: "Customer Name",
        placeholder: "e.g., Maria Silva",
        component: "body",
      },
      {
        name: "course_name",
        label: "Course Name",
        placeholder: "e.g., Engenharia de Software",
        component: "body",
      },
      {
        name: "course_start_date",
        label: "Course Start Date",
        placeholder: "e.g., 10 de Março de 2026",
        component: "body",
      },
      {
        name: "enrollment_number",
        label: "Enrollment Number",
        placeholder: "123456",
        component: "button",
        fixedValue: "123456",
      },
    ],
    hasQuickReply: false,
  },
  {
    id: "payment_reminder",
    displayName: "Payment Reminder",
    description:
      "Reminds a parent about an upcoming or overdue fee. " +
      "Includes the student name, amount, and due date.",
    templateName: "payment_reminder",
    language: "en_US",
    parameterDefinitions: [
      {
        name: "StudentName",
        label: "Student Name",
        placeholder: "e.g., João Santos",
        component: "body",
      },
      {
        name: "Amount",
        label: "Amount",
        placeholder: "e.g., R$ 450.00",
        component: "body",
      },
      {
        name: "DueDate",
        label: "Due Date",
        placeholder: "e.g., March 15, 2026",
        component: "body",
      },
    ],
    hasQuickReply: false,
  },
  {
    id: "attendance_alert",
    displayName: "Attendance Alert",
    description:
      "Notifica o responsável quando um aluno está ausente. " +
      "Inclui variável de cabeçalho e botões Quick Reply para resposta.",
    templateName: "attendance_alert",
    language: "pt_BR",
    parameterDefinitions: [
      {
        name: "student_name",
        label: "Student Name",
        placeholder: "e.g., Ana Oliveira",
        component: "header",
      },
      {
        name: "class_name",
        label: "Class Name",
        placeholder: "e.g., Matemática",
        component: "body",
      },
      {
        name: "class_date",
        label: "Class Date",
        placeholder: "e.g., 2 de Março de 2026",
        component: "body",
      },
    ],
    hasQuickReply: true,
    quickReplyButtons: ["Acknowledge", "Call School"],
  },
  {
    id: "sample_shipping_confirmation",
    displayName: "Sample: Shipping Confirmation",
    description:
      "Meta-provided sample template for testing. " +
      "Notifies the recipient about a package shipment with an estimated delivery time.",
    templateName: "sample_shipping_confirmation",
    language: "en_US",
    parameterDefinitions: [
      {
        name: "Days",
        label: "Delivery Days",
        placeholder: "e.g., 3",
        component: "body",
      },
    ],
    hasQuickReply: false,
  },
];
