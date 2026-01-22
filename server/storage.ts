import { 
  appointments, type Appointment, type InsertAppointment,
  questionSets, type QuestionSet, type InsertQuestionSet,
  symptoms, type Symptom, type InsertSymptom,
  readings, type Reading, type InsertReading,
  reminders, type Reminder, type InsertReminder,
  healthcareProviders, type HealthcareProvider, type InsertHealthcareProvider,
  patientProfiles, type PatientProfile, type InsertPatientProfile,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Patient Profiles
  getPatientProfiles(userId: string): Promise<PatientProfile[]>;
  getPatientProfile(id: number, userId: string): Promise<PatientProfile | undefined>;
  createPatientProfile(data: InsertPatientProfile): Promise<PatientProfile>;
  updatePatientProfile(id: number, userId: string, data: Partial<InsertPatientProfile>): Promise<PatientProfile | undefined>;
  deletePatientProfile(id: number, userId: string): Promise<boolean>;
  setDefaultPatientProfile(id: number, userId: string): Promise<PatientProfile | undefined>;
  
  // Healthcare Providers
  getHealthcareProviders(userId: string): Promise<HealthcareProvider[]>;
  createHealthcareProvider(data: InsertHealthcareProvider): Promise<HealthcareProvider>;
  updateHealthcareProvider(id: number, userId: string, data: Partial<InsertHealthcareProvider>): Promise<HealthcareProvider | undefined>;
  deleteHealthcareProvider(id: number, userId: string): Promise<boolean>;
  
  // Appointments
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(data: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, data: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<void>;
  
  // Question Sets
  getQuestionSets(): Promise<QuestionSet[]>;
  getQuestionSet(id: number): Promise<QuestionSet | undefined>;
  createQuestionSet(data: InsertQuestionSet): Promise<QuestionSet>;
  
  // Symptoms
  getSymptoms(): Promise<Symptom[]>;
  getSymptom(id: number): Promise<Symptom | undefined>;
  createSymptom(data: InsertSymptom): Promise<Symptom>;
  deleteSymptom(id: number): Promise<void>;
  
  // Readings
  getReadings(): Promise<Reading[]>;
  getReading(id: number): Promise<Reading | undefined>;
  createReading(data: InsertReading): Promise<Reading>;
  deleteReading(id: number): Promise<void>;
  
  // Reminders
  getReminders(): Promise<Reminder[]>;
  getReminder(id: number): Promise<Reminder | undefined>;
  createReminder(data: InsertReminder): Promise<Reminder>;
  updateReminder(id: number, data: Partial<InsertReminder>): Promise<Reminder | undefined>;
  deleteReminder(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Patient Profiles
  async getPatientProfiles(userId: string): Promise<PatientProfile[]> {
    return db.select().from(patientProfiles)
      .where(eq(patientProfiles.userId, userId))
      .orderBy(desc(patientProfiles.isDefault), patientProfiles.name);
  }

  async getPatientProfile(id: number, userId: string): Promise<PatientProfile | undefined> {
    const [profile] = await db.select().from(patientProfiles)
      .where(and(eq(patientProfiles.id, id), eq(patientProfiles.userId, userId)));
    return profile || undefined;
  }

  async createPatientProfile(data: InsertPatientProfile): Promise<PatientProfile> {
    const [profile] = await db.insert(patientProfiles).values(data).returning();
    return profile;
  }

  async updatePatientProfile(id: number, userId: string, data: Partial<InsertPatientProfile>): Promise<PatientProfile | undefined> {
    const [profile] = await db.update(patientProfiles)
      .set(data)
      .where(and(eq(patientProfiles.id, id), eq(patientProfiles.userId, userId)))
      .returning();
    return profile || undefined;
  }

  async deletePatientProfile(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(patientProfiles)
      .where(and(eq(patientProfiles.id, id), eq(patientProfiles.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async setDefaultPatientProfile(id: number, userId: string): Promise<PatientProfile | undefined> {
    // First unset all defaults for this user
    await db.update(patientProfiles)
      .set({ isDefault: false })
      .where(eq(patientProfiles.userId, userId));
    
    // Then set the selected one as default
    const [profile] = await db.update(patientProfiles)
      .set({ isDefault: true })
      .where(and(eq(patientProfiles.id, id), eq(patientProfiles.userId, userId)))
      .returning();
    return profile || undefined;
  }
  
  // Healthcare Providers
  async getHealthcareProviders(userId: string): Promise<HealthcareProvider[]> {
    return db.select().from(healthcareProviders)
      .where(eq(healthcareProviders.userId, userId))
      .orderBy(desc(healthcareProviders.createdAt));
  }

  async createHealthcareProvider(data: InsertHealthcareProvider): Promise<HealthcareProvider> {
    const [provider] = await db.insert(healthcareProviders).values(data).returning();
    return provider;
  }

  async updateHealthcareProvider(id: number, userId: string, data: Partial<InsertHealthcareProvider>): Promise<HealthcareProvider | undefined> {
    const [provider] = await db.update(healthcareProviders)
      .set(data)
      .where(and(eq(healthcareProviders.id, id), eq(healthcareProviders.userId, userId)))
      .returning();
    return provider || undefined;
  }

  async deleteHealthcareProvider(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(healthcareProviders)
      .where(and(eq(healthcareProviders.id, id), eq(healthcareProviders.userId, userId)))
      .returning();
    return result.length > 0;
  }
  
  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return db.select().from(appointments).orderBy(desc(appointments.appointmentDate));
  }
  
  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }
  
  async createAppointment(data: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values(data).returning();
    return appointment;
  }
  
  async updateAppointment(id: number, data: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [appointment] = await db.update(appointments).set(data).where(eq(appointments.id, id)).returning();
    return appointment || undefined;
  }
  
  async deleteAppointment(id: number): Promise<void> {
    await db.delete(appointments).where(eq(appointments.id, id));
  }
  
  // Question Sets
  async getQuestionSets(): Promise<QuestionSet[]> {
    return db.select().from(questionSets).orderBy(desc(questionSets.createdAt));
  }
  
  async getQuestionSet(id: number): Promise<QuestionSet | undefined> {
    const [questionSet] = await db.select().from(questionSets).where(eq(questionSets.id, id));
    return questionSet || undefined;
  }
  
  async createQuestionSet(data: InsertQuestionSet): Promise<QuestionSet> {
    const [questionSet] = await db.insert(questionSets).values(data).returning();
    return questionSet;
  }
  
  // Symptoms
  async getSymptoms(): Promise<Symptom[]> {
    return db.select().from(symptoms).orderBy(desc(symptoms.recordedAt));
  }
  
  async getSymptom(id: number): Promise<Symptom | undefined> {
    const [symptom] = await db.select().from(symptoms).where(eq(symptoms.id, id));
    return symptom || undefined;
  }
  
  async createSymptom(data: InsertSymptom): Promise<Symptom> {
    const [symptom] = await db.insert(symptoms).values(data).returning();
    return symptom;
  }
  
  async deleteSymptom(id: number): Promise<void> {
    await db.delete(symptoms).where(eq(symptoms.id, id));
  }
  
  // Readings
  async getReadings(): Promise<Reading[]> {
    return db.select().from(readings).orderBy(desc(readings.recordedAt));
  }
  
  async getReading(id: number): Promise<Reading | undefined> {
    const [reading] = await db.select().from(readings).where(eq(readings.id, id));
    return reading || undefined;
  }
  
  async createReading(data: InsertReading): Promise<Reading> {
    const insertData = {
      ...data,
      recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
    };
    const [reading] = await db.insert(readings).values(insertData).returning();
    return reading;
  }
  
  async deleteReading(id: number): Promise<void> {
    await db.delete(readings).where(eq(readings.id, id));
  }
  
  // Reminders
  async getReminders(): Promise<Reminder[]> {
    return db.select().from(reminders).orderBy(desc(reminders.createdAt));
  }
  
  async getReminder(id: number): Promise<Reminder | undefined> {
    const [reminder] = await db.select().from(reminders).where(eq(reminders.id, id));
    return reminder || undefined;
  }
  
  async createReminder(data: InsertReminder): Promise<Reminder> {
    const [reminder] = await db.insert(reminders).values(data).returning();
    return reminder;
  }
  
  async updateReminder(id: number, data: Partial<InsertReminder>): Promise<Reminder | undefined> {
    const [reminder] = await db.update(reminders).set(data).where(eq(reminders.id, id)).returning();
    return reminder || undefined;
  }
  
  async deleteReminder(id: number): Promise<void> {
    await db.delete(reminders).where(eq(reminders.id, id));
  }
}

export const storage = new DatabaseStorage();
