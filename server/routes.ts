import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import { 
  insertAppointmentSchema,
  insertSymptomSchema,
  insertReadingSchema,
  insertReminderSchema,
} from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const generateQuestionsSchema = z.object({
  condition: z.string().min(1),
  symptoms: z.string().min(1),
  medications: z.string().optional(),
  appointmentId: z.string().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Appointments
  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ error: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const data = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(data);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(400).json({ error: "Invalid appointment data" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(id, data);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error updating appointment:", error);
      res.status(400).json({ error: "Invalid appointment data" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAppointment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Symptoms
  app.get("/api/symptoms", async (req, res) => {
    try {
      const symptoms = await storage.getSymptoms();
      res.json(symptoms);
    } catch (error) {
      console.error("Error fetching symptoms:", error);
      res.status(500).json({ error: "Failed to fetch symptoms" });
    }
  });

  app.post("/api/symptoms", async (req, res) => {
    try {
      const data = insertSymptomSchema.parse(req.body);
      const symptom = await storage.createSymptom(data);
      res.status(201).json(symptom);
    } catch (error) {
      console.error("Error creating symptom:", error);
      res.status(400).json({ error: "Invalid symptom data" });
    }
  });

  app.delete("/api/symptoms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSymptom(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting symptom:", error);
      res.status(500).json({ error: "Failed to delete symptom" });
    }
  });

  // Readings
  app.get("/api/readings", async (req, res) => {
    try {
      const readings = await storage.getReadings();
      res.json(readings);
    } catch (error) {
      console.error("Error fetching readings:", error);
      res.status(500).json({ error: "Failed to fetch readings" });
    }
  });

  app.post("/api/readings", async (req, res) => {
    try {
      const data = insertReadingSchema.parse(req.body);
      const reading = await storage.createReading(data);
      res.status(201).json(reading);
    } catch (error) {
      console.error("Error creating reading:", error);
      res.status(400).json({ error: "Invalid reading data" });
    }
  });

  app.delete("/api/readings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReading(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reading:", error);
      res.status(500).json({ error: "Failed to delete reading" });
    }
  });

  // Reminders
  app.get("/api/reminders", async (req, res) => {
    try {
      const reminders = await storage.getReminders();
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", async (req, res) => {
    try {
      const data = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(data);
      res.status(201).json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(400).json({ error: "Invalid reminder data" });
    }
  });

  app.patch("/api/reminders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertReminderSchema.partial().parse(req.body);
      const reminder = await storage.updateReminder(id, data);
      if (!reminder) {
        return res.status(404).json({ error: "Reminder not found" });
      }
      res.json(reminder);
    } catch (error) {
      console.error("Error updating reminder:", error);
      res.status(400).json({ error: "Invalid reminder data" });
    }
  });

  app.delete("/api/reminders/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReminder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      res.status(500).json({ error: "Failed to delete reminder" });
    }
  });

  // Question Sets
  app.get("/api/questions", async (req, res) => {
    try {
      const questionSets = await storage.getQuestionSets();
      res.json(questionSets);
    } catch (error) {
      console.error("Error fetching question sets:", error);
      res.status(500).json({ error: "Failed to fetch question sets" });
    }
  });

  // Generate Questions using AI
  app.post("/api/questions/generate", async (req, res) => {
    try {
      const { condition, symptoms, medications, appointmentId } = generateQuestionsSchema.parse(req.body);

      const systemPrompt = `You are a helpful medical assistant that generates relevant questions for patients to ask their doctors. You do NOT provide medical advice, diagnosis, or treatment recommendations. You only help patients prepare thoughtful questions for their healthcare provider visits.

Your task is to generate structured, relevant questions based on the patient's condition, symptoms, and medications. Also identify any potential red flags that should be mentioned to the doctor immediately.

IMPORTANT: 
- Never provide medical advice or diagnosis
- Focus only on generating questions to ask the doctor
- Be thorough but not overwhelming
- Use simple, patient-friendly language

Return your response as a JSON object with the following structure:
{
  "questions": [
    {
      "category": "Category Name",
      "items": ["Question 1", "Question 2", ...]
    }
  ],
  "redFlags": ["Red flag 1", "Red flag 2", ...]
}

Categories should include relevant ones like:
- Understanding My Condition
- Symptoms and Concerns
- Treatment Options
- Medications
- Lifestyle and Prevention
- Follow-up Care`;

      const userPrompt = `Please generate relevant questions for my doctor visit.

Condition/Reason for Visit: ${condition}

Current Symptoms: ${symptoms}

${medications ? `Current Medications: ${medications}` : "No medications listed"}

Generate comprehensive but focused questions I should ask my doctor, organized by category. Also identify any symptoms or combinations that might be red flags worth mentioning immediately.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const generatedData = JSON.parse(content);

      // Save to database
      await storage.createQuestionSet({
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
        condition,
        symptoms,
        medications: medications || null,
        generatedQuestions: JSON.stringify(generatedData.questions),
        redFlags: generatedData.redFlags ? JSON.stringify(generatedData.redFlags) : null,
      });

      res.json(generatedData);
    } catch (error) {
      console.error("Error generating questions:", error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });

  return httpServer;
}
