import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
