import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { z } from "zod";
import validator from "validator";
import {
  insertAppointmentSchema,
  insertSymptomSchema,
  insertReadingSchema,
  insertReminderSchema,
  insertHealthcareProviderSchema,
  insertTodoSchema,
} from "@shared/schema";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Security helper: Validate and parse numeric ID from params
function parseId(idString: string | string[] | undefined): number | null {
  if (!idString || Array.isArray(idString)) return null;
  const id = parseInt(idString, 10);
  if (isNaN(id) || id <= 0 || id > Number.MAX_SAFE_INTEGER) {
    return null;
  }
  return id;
}

// Security helper: Validate email format
function isValidEmail(email: string): boolean {
  return validator.isEmail(email) && email.length <= 254;
}

// Security helper: Sanitize string input (prevent XSS in stored data)
function sanitizeString(str: string | null | undefined): string | null {
  if (!str) return null;
  return validator.escape(str.trim()).slice(0, 10000); // Limit length
}

// Security middleware: Validate ID parameter
function validateIdParam(req: Request, res: Response, next: NextFunction) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(400).json({ error: "Invalid ID parameter" });
  }
  (req as any).validatedId = id;
  next();
}

const generateQuestionsSchema = z.object({
  condition: z.string().min(1).max(500),
  symptoms: z.string().max(2000).optional(),
  medications: z.string().max(1000).optional(),
  appointmentId: z.string().max(20).optional(),
});

// Patient profile input schema with proper date handling
// Strips userId and isDefault from client input for security
const patientProfileInputSchema = z.object({
  name: z.string().min(1).max(100),
  relationship: z.string().min(1).max(50),
  dateOfBirth: z.string().optional().nullable().transform(val => {
    if (!val || val === "") return null;
    const date = new Date(val);
    if (isNaN(date.getTime())) return null;
    return date;
  }),
  gender: z.string().max(50).optional().nullable(),
  bloodType: z.string().max(10).optional().nullable(),
  allergies: z.string().max(2000).optional().nullable(),
  conditions: z.string().max(2000).optional().nullable(),
  medications: z.string().max(2000).optional().nullable(),
  emergencyContact: z.string().max(100).optional().nullable(),
  emergencyPhone: z.string().max(20).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

// Email export schema with validation
const emailExportSchema = z.object({
  email: z.string().email().max(254),
  report: z.string().min(1).max(100000),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup authentication first
  await setupAuth(app);
  registerAuthRoutes(app);

  // Patient Profiles (protected routes)
  app.get("/api/patient-profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profiles = await storage.getPatientProfiles(userId);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching patient profiles:", error);
      res.status(500).json({ error: "Failed to fetch patient profiles" });
    }
  });

  app.get("/api/patient-profiles/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      const userId = req.user.claims.sub;
      const profile = await storage.getPatientProfile(id, userId);
      if (!profile) {
        return res.status(404).json({ error: "Patient profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching patient profile:", error);
      res.status(500).json({ error: "Failed to fetch patient profile" });
    }
  });

  app.post("/api/patient-profiles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      // Parse input, strip userId and isDefault from client for security
      const inputData = patientProfileInputSchema.parse(req.body);
      const data = { ...inputData, userId, isDefault: false };
      const profile = await storage.createPatientProfile(data);
      res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating patient profile:", error);
      res.status(400).json({ error: "Invalid patient profile data" });
    }
  });

  app.patch("/api/patient-profiles/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      const userId = req.user.claims.sub;
      // Parse input, strip userId and isDefault from client for security
      const data = patientProfileInputSchema.partial().parse(req.body);
      const profile = await storage.updatePatientProfile(id, userId, data);
      if (!profile) {
        return res.status(404).json({ error: "Patient profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error updating patient profile:", error);
      res.status(400).json({ error: "Invalid patient profile data" });
    }
  });

  app.delete("/api/patient-profiles/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      const userId = req.user.claims.sub;
      const deleted = await storage.deletePatientProfile(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Patient profile not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting patient profile:", error);
      res.status(500).json({ error: "Failed to delete patient profile" });
    }
  });

  app.post("/api/patient-profiles/:id/set-default", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      const userId = req.user.claims.sub;
      const profile = await storage.setDefaultPatientProfile(id, userId);
      if (!profile) {
        return res.status(404).json({ error: "Patient profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error setting default patient profile:", error);
      res.status(500).json({ error: "Failed to set default patient profile" });
    }
  });

  // Healthcare Providers (protected routes)
  app.get("/api/providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providers = await storage.getHealthcareProviders(userId);
      res.json(providers);
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ error: "Failed to fetch providers" });
    }
  });

  app.post("/api/providers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertHealthcareProviderSchema.parse({ ...req.body, userId });
      const provider = await storage.createHealthcareProvider(data);
      res.status(201).json(provider);
    } catch (error) {
      console.error("Error creating provider:", error);
      res.status(400).json({ error: "Invalid provider data" });
    }
  });

  app.patch("/api/providers/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      const userId = req.user.claims.sub;
      const data = insertHealthcareProviderSchema.partial().parse(req.body);
      const provider = await storage.updateHealthcareProvider(id, userId, data);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      console.error("Error updating provider:", error);
      res.status(400).json({ error: "Invalid provider data" });
    }
  });

  app.delete("/api/providers/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteHealthcareProvider(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting provider:", error);
      res.status(500).json({ error: "Failed to delete provider" });
    }
  });

  // Appointments (protected with authentication and ID validation)
  app.get("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ error: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
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

  app.post("/api/appointments", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(data);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      res.status(400).json({ error: "Invalid appointment data" });
    }
  });

  app.patch("/api/appointments/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
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

  app.delete("/api/appointments/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      await storage.deleteAppointment(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ error: "Failed to delete appointment" });
    }
  });

  // Symptoms (protected with authentication and ID validation)
  app.get("/api/symptoms", isAuthenticated, async (req: any, res) => {
    try {
      const symptoms = await storage.getSymptoms();
      res.json(symptoms);
    } catch (error) {
      console.error("Error fetching symptoms:", error);
      res.status(500).json({ error: "Failed to fetch symptoms" });
    }
  });

  app.post("/api/symptoms", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertSymptomSchema.parse(req.body);
      const symptom = await storage.createSymptom(data);
      res.status(201).json(symptom);
    } catch (error) {
      console.error("Error creating symptom:", error);
      res.status(400).json({ error: "Invalid symptom data" });
    }
  });

  app.delete("/api/symptoms/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      await storage.deleteSymptom(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting symptom:", error);
      res.status(500).json({ error: "Failed to delete symptom" });
    }
  });

  // Readings (protected with authentication and ID validation)
  app.get("/api/readings", isAuthenticated, async (req: any, res) => {
    try {
      const readings = await storage.getReadings();
      res.json(readings);
    } catch (error) {
      console.error("Error fetching readings:", error);
      res.status(500).json({ error: "Failed to fetch readings" });
    }
  });

  app.post("/api/readings", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertReadingSchema.parse(req.body);
      const reading = await storage.createReading(data);
      res.status(201).json(reading);
    } catch (error) {
      console.error("Error creating reading:", error);
      res.status(400).json({ error: "Invalid reading data" });
    }
  });

  app.delete("/api/readings/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      await storage.deleteReading(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reading:", error);
      res.status(500).json({ error: "Failed to delete reading" });
    }
  });

  // Reminders (protected with authentication and ID validation)
  app.get("/api/reminders", isAuthenticated, async (req: any, res) => {
    try {
      const reminders = await storage.getReminders();
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  app.post("/api/reminders", isAuthenticated, async (req: any, res) => {
    try {
      const data = insertReminderSchema.parse(req.body);
      const reminder = await storage.createReminder(data);
      res.status(201).json(reminder);
    } catch (error) {
      console.error("Error creating reminder:", error);
      res.status(400).json({ error: "Invalid reminder data" });
    }
  });

  app.patch("/api/reminders/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
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

  app.delete("/api/reminders/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      await storage.deleteReminder(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting reminder:", error);
      res.status(500).json({ error: "Failed to delete reminder" });
    }
  });

  // Question Sets (protected)
  app.get("/api/questions", isAuthenticated, async (req: any, res) => {
    try {
      const questionSets = await storage.getQuestionSets();
      res.json(questionSets);
    } catch (error) {
      console.error("Error fetching question sets:", error);
      res.status(500).json({ error: "Failed to fetch question sets" });
    }
  });

  // Nearby Services using OpenStreetMap Overpass API (public but with validation)
  app.get("/api/nearby", async (req, res) => {
    try {
      const { type, lat, lon } = req.query;
      
      if (!type || !lat || !lon) {
        return res.status(400).json({ error: "Missing required parameters: type, lat, lon" });
      }

      // Validate service type (whitelist allowed values)
      const allowedTypes = ["pharmacy", "gp", "dentist", "optician", "hospital"];
      if (!allowedTypes.includes(type as string)) {
        return res.status(400).json({ error: "Invalid service type" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);

      // Validate coordinate ranges
      if (isNaN(latitude) || isNaN(longitude) || 
          latitude < -90 || latitude > 90 || 
          longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }

      const radius = 10000; // 10km radius

      // Map our service types to OSM amenity/healthcare tags (include nodes, ways, and relations)
      let osmQuery = "";
      switch (type) {
        case "pharmacy":
          osmQuery = `
            node["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
            way["amenity"="pharmacy"](around:${radius},${latitude},${longitude});
          `;
          break;
        case "gp":
          osmQuery = `
            node["amenity"="doctors"](around:${radius},${latitude},${longitude});
            way["amenity"="doctors"](around:${radius},${latitude},${longitude});
            node["amenity"="clinic"](around:${radius},${latitude},${longitude});
            way["amenity"="clinic"](around:${radius},${latitude},${longitude});
            node["healthcare"="doctor"](around:${radius},${latitude},${longitude});
            way["healthcare"="doctor"](around:${radius},${latitude},${longitude});
            node["healthcare"="clinic"](around:${radius},${latitude},${longitude});
            way["healthcare"="clinic"](around:${radius},${latitude},${longitude});
          `;
          break;
        case "dentist":
          osmQuery = `
            node["amenity"="dentist"](around:${radius},${latitude},${longitude});
            way["amenity"="dentist"](around:${radius},${latitude},${longitude});
            node["healthcare"="dentist"](around:${radius},${latitude},${longitude});
            way["healthcare"="dentist"](around:${radius},${latitude},${longitude});
          `;
          break;
        case "optician":
          osmQuery = `
            node["shop"="optician"](around:${radius},${latitude},${longitude});
            way["shop"="optician"](around:${radius},${latitude},${longitude});
            node["healthcare"="optometrist"](around:${radius},${latitude},${longitude});
            way["healthcare"="optometrist"](around:${radius},${latitude},${longitude});
          `;
          break;
        case "hospital":
          osmQuery = `
            node["amenity"="hospital"](around:${radius},${latitude},${longitude});
            way["amenity"="hospital"](around:${radius},${latitude},${longitude});
            relation["amenity"="hospital"](around:${radius},${latitude},${longitude});
            node["healthcare"="hospital"](around:${radius},${latitude},${longitude});
            way["healthcare"="hospital"](around:${radius},${latitude},${longitude});
            relation["healthcare"="hospital"](around:${radius},${latitude},${longitude});
          `;
          break;
        default:
          return res.status(400).json({ error: "Invalid service type" });
      }

      const overpassQuery = `
        [out:json][timeout:25];
        (
          ${osmQuery}
        );
        out body center;
      `;

      const overpassUrl = "https://overpass-api.de/api/interpreter";
      const response = await fetch(overpassUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(overpassQuery)}`,
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform OSM data to our format - include elements with or without name
      const typeLabels: Record<string, string> = {
        pharmacy: "Pharmacy",
        gp: "Medical Practice",
        dentist: "Dental Practice",
        optician: "Optician",
        hospital: "Hospital",
      };
      
      const places = data.elements
        .filter((el: any) => el.lat || el.center?.lat) // Must have coordinates
        .map((el: any) => {
          // Build a fallback name from address if no name tag
          const address = [
            el.tags?.["addr:housenumber"],
            el.tags?.["addr:street"],
            el.tags?.["addr:city"],
            el.tags?.["addr:postcode"],
          ]
            .filter(Boolean)
            .join(", ");
          
          const fallbackName = address 
            ? `${typeLabels[type as string] || "Healthcare"} at ${el.tags?.["addr:street"] || address}`
            : `${typeLabels[type as string] || "Healthcare Facility"}`;

          return {
            id: el.id.toString(),
            name: el.tags?.name || fallbackName,
            type: type,
            lat: el.lat || el.center?.lat,
            lon: el.lon || el.center?.lon,
            address: address || undefined,
            phone: el.tags?.phone || el.tags?.["contact:phone"] || undefined,
            openingHours: el.tags?.opening_hours || undefined,
            website: el.tags?.website || el.tags?.["contact:website"] || undefined,
          };
        })
        .slice(0, 25); // Limit to 25 results

      res.json(places);
    } catch (error) {
      console.error("Error fetching nearby services:", error);
      res.status(500).json({ error: "Failed to fetch nearby services" });
    }
  });

  // Generate Questions using AI (protected)
  app.post("/api/questions/generate", isAuthenticated, async (req: any, res) => {
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
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
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
        symptoms: symptoms || "",
        medications: medications || null,
        generatedQuestions: JSON.stringify(generatedData.questions),
        redFlags: generatedData.redFlags ? JSON.stringify(generatedData.redFlags) : null,
      });

      res.json(generatedData);
    } catch (error) {
      console.error("Error generating questions:", error);
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);
        if ((error as any).response) {
          console.error("OpenAI Response Error:", (error as any).response.data);
        }
      }
      res.status(500).json({ error: "Failed to generate questions", details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Todos (protected routes, scoped to authenticated user)
  app.get("/api/todos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const items = await storage.getTodos(userId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  });

  app.post("/api/todos", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = insertTodoSchema.parse({ ...req.body, userId });
      const todo = await storage.createTodo(data);
      res.status(201).json(todo);
    } catch (error) {
      console.error("Error creating todo:", error);
      res.status(400).json({ error: "Invalid todo data" });
    }
  });

  app.patch("/api/todos/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      const userId = req.user.claims.sub;
      const data = insertTodoSchema.partial().parse(req.body);
      const todo = await storage.updateTodo(id, userId, data);
      if (!todo) {
        return res.status(404).json({ error: "Todo not found" });
      }
      res.json(todo);
    } catch (error) {
      console.error("Error updating todo:", error);
      res.status(400).json({ error: "Invalid todo data" });
    }
  });

  app.delete("/api/todos/:id", isAuthenticated, validateIdParam, async (req: any, res) => {
    try {
      const id = req.validatedId;
      const userId = req.user.claims.sub;
      const deleted = await storage.deleteTodo(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Todo not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting todo:", error);
      res.status(500).json({ error: "Failed to delete todo" });
    }
  });

  // Export/Share - Email endpoint (protected with strict validation)
  app.post("/api/export/email", isAuthenticated, async (req: any, res) => {
    try {
      // Validate input with schema
      const validatedData = emailExportSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({ error: "Invalid email or report data" });
      }

      const { email, report } = validatedData.data;

      // Additional email validation
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: "Invalid email address format" });
      }

      // Check if SendGrid is configured
      const sendgridApiKey = process.env.SENDGRID_API_KEY;
      const senderEmail = process.env.SENDGRID_SENDER_EMAIL || "noreply@healthprep.app";
      
      if (!sendgridApiKey) {
        return res.status(503).json({ 
          error: "Email service not configured" 
        });
      }

      // Sanitize report content before sending
      const sanitizedReport = report.slice(0, 100000); // Enforce max length

      // Send email via SendGrid
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: senderEmail, name: "HealthPrep" },
          subject: "Your HealthPrep Health Report",
          content: [
            {
              type: "text/plain",
              value: sanitizedReport,
            },
          ],
        }),
      });

      if (!response.ok) {
        console.error("SendGrid error");
        throw new Error("Email service error");
      }

      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  return httpServer;
}
