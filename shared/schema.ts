import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Re-export auth models (users and sessions tables)
export * from "./models/auth";
import { users } from "./models/auth";

// Healthcare Providers table (GP, Dentist, Specialist, etc.)
export const healthcareProviders = pgTable("healthcare_providers", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  name: text("name").notNull(),
  specialty: text("specialty"),
  practice: text("practice"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const healthcareProvidersRelations = relations(healthcareProviders, ({ one }) => ({
  user: one(users, {
    fields: [healthcareProviders.userId],
    references: [users.id],
  }),
}));

export const insertHealthcareProviderSchema = createInsertSchema(healthcareProviders).omit({
  id: true,
  createdAt: true,
});

export type HealthcareProvider = typeof healthcareProviders.$inferSelect;
export type InsertHealthcareProvider = z.infer<typeof insertHealthcareProviderSchema>;

// Patient Profiles table (for managing multiple patients per user account)
export const patientProfiles = pgTable("patient_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(), // "self", "child", "spouse", "parent", "other"
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"), // "male", "female", "other", "prefer_not_to_say"
  bloodType: text("blood_type"),
  allergies: text("allergies"),
  conditions: text("conditions"),
  medications: text("medications"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  notes: text("notes"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const patientProfilesRelations = relations(patientProfiles, ({ one }) => ({
  user: one(users, {
    fields: [patientProfiles.userId],
    references: [users.id],
  }),
}));

export const insertPatientProfileSchema = createInsertSchema(patientProfiles).omit({
  id: true,
  createdAt: true,
});

export type PatientProfile = typeof patientProfiles.$inferSelect;
export type InsertPatientProfile = z.infer<typeof insertPatientProfileSchema>;

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  doctorName: text("doctor_name"),
  specialty: text("specialty"),
  appointmentDate: timestamp("appointment_date").notNull(),
  location: text("location"),
  notes: text("notes"),
  reminderEnabled: boolean("reminder_enabled").default(true),
  reminderDaysBefore: integer("reminder_days_before").default(1),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const appointmentsRelations = relations(appointments, ({ many }) => ({
  questionSets: many(questionSets),
  readings: many(readings),
  symptoms: many(symptoms),
}));

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Question Sets table (generated questions for an appointment)
export const questionSets = pgTable("question_sets", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id, { onDelete: "cascade" }),
  condition: text("condition").notNull(),
  symptoms: text("symptoms").notNull(),
  medications: text("medications"),
  generatedQuestions: text("generated_questions").notNull(),
  redFlags: text("red_flags"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const questionSetsRelations = relations(questionSets, ({ one }) => ({
  appointment: one(appointments, {
    fields: [questionSets.appointmentId],
    references: [appointments.id],
  }),
}));

export const insertQuestionSetSchema = createInsertSchema(questionSets).omit({
  id: true,
  createdAt: true,
});

export type QuestionSet = typeof questionSets.$inferSelect;
export type InsertQuestionSet = z.infer<typeof insertQuestionSetSchema>;

// Symptoms tracking table
export const symptoms = pgTable("symptoms", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  severity: integer("severity").notNull(),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const symptomsRelations = relations(symptoms, ({ one }) => ({
  appointment: one(appointments, {
    fields: [symptoms.appointmentId],
    references: [appointments.id],
  }),
}));

export const insertSymptomSchema = createInsertSchema(symptoms).omit({
  id: true,
  recordedAt: true,
});

export type Symptom = typeof symptoms.$inferSelect;
export type InsertSymptom = z.infer<typeof insertSymptomSchema>;

// Health readings table (blood pressure, glucose, temperature, etc.)
export const readings = pgTable("readings", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  type: text("type").notNull(),
  value: real("value").notNull(),
  unit: text("unit").notNull(),
  secondaryValue: real("secondary_value"),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const readingsRelations = relations(readings, ({ one }) => ({
  appointment: one(appointments, {
    fields: [readings.appointmentId],
    references: [appointments.id],
  }),
}));

export const insertReadingSchema = createInsertSchema(readings).omit({
  id: true,
  recordedAt: true,
});

export type Reading = typeof readings.$inferSelect;
export type InsertReading = z.infer<typeof insertReadingSchema>;

// Reminders configuration table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  intervalHours: integer("interval_hours").notNull(),
  isActive: boolean("is_active").default(true),
  lastTriggered: timestamp("last_triggered"),
  nextTrigger: timestamp("next_trigger"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
  lastTriggered: true,
});

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

// Re-export chat models for OpenAI integration
export * from "./models/chat";
