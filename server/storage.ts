import { 
  users, type User, type InsertUser,
  appointments, type Appointment, type InsertAppointment,
  questionSets, type QuestionSet, type InsertQuestionSet,
  symptoms, type Symptom, type InsertSymptom,
  readings, type Reading, type InsertReading,
  reminders, type Reminder, type InsertReminder,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
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
    const [reading] = await db.insert(readings).values(data).returning();
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
