import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertKegSchema, insertCustomerSchema, updateKegStatusSchema, insertOrderSchema, insertCustomerNoteSchema, insertCiderTypeSchema, insertCiderBatchSchema, insertCiderIngredientSchema, insertFermentationBatchSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Keg routes
  app.get("/api/kegs", async (req, res) => {
    try {
      const { status, customer } = req.query;
      let kegs;
      
      if (status) {
        kegs = await storage.getKegsByStatus(status as string);
      } else if (customer) {
        kegs = await storage.getKegsByCustomer(customer as string);
      } else {
        kegs = await storage.getAllKegs();
      }
      
      res.json(kegs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch kegs" });
    }
  });

  app.get("/api/kegs/:id", async (req, res) => {
    try {
      const keg = await storage.getKeg(req.params.id);
      if (!keg) {
        return res.status(404).json({ message: "Keg not found" });
      }
      res.json(keg);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch keg" });
    }
  });

  app.get("/api/kegs/qr/:qrCode", async (req, res) => {
    try {
      const keg = await storage.getKegByQrCode(req.params.qrCode);
      if (!keg) {
        return res.status(404).json({ message: "Keg not found" });
      }
      res.json(keg);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch keg by QR code" });
    }
  });

  app.post("/api/kegs", async (req, res) => {
    try {
      const kegData = insertKegSchema.parse(req.body);
      const keg = await storage.createKeg(kegData);
      res.status(201).json(keg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid keg data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create keg" });
    }
  });

  app.patch("/api/kegs/:id/status", async (req, res) => {
    try {
      const updateData = updateKegStatusSchema.parse(req.body);
      
      // When keg is marked as clean, clear the beer type
      if (updateData.status === "clean") {
        updateData.beerType = undefined;
      }
      
      // When keg is marked as full, beer type is required
      if (updateData.status === "full" && (!updateData.beerType || updateData.beerType.trim() === "")) {
        return res.status(400).json({ 
          message: "Beer type is required for full kegs",
          errors: [{ path: ["beerType"], message: "Beer type is required for full kegs" }]
        });
      }
      
      const keg = await storage.updateKegStatus(req.params.id, updateData);
      res.json(keg);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid update data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update keg status" });
    }
  });

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const updateData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, updateData);
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Activity routes
  app.get("/api/activities", async (req, res) => {
    try {
      const { kegId, limit } = req.query;
      let activities;
      
      if (kegId) {
        activities = await storage.getActivitiesByKeg(kegId as string);
      } else {
        activities = await storage.getRecentActivities(limit ? parseInt(limit as string) : 10);
      }
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Order routes
  app.get("/api/orders/customer/:customerId", async (req, res) => {
    try {
      const orders = await storage.getOrdersByCustomer(req.params.customerId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/date-range", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const orders = await storage.getOrdersByDateRange(
        new Date(startDate as string), 
        new Date(endDate as string)
      );
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders by date range" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      // Convert weekStartDate to proper Date object before validation
      let bodyWithDate = { ...req.body };
      if (req.body.weekStartDate && typeof req.body.weekStartDate === 'string') {
        bodyWithDate.weekStartDate = new Date(req.body.weekStartDate);
      }
      
      const orderData = insertOrderSchema.parse(bodyWithDate);
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const updateData = insertOrderSchema.partial().parse(req.body);
      const order = await storage.updateOrder(req.params.id, updateData);
      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Customer notes routes
  app.get("/api/customer-notes/:customerId", async (req, res) => {
    try {
      const notes = await storage.getCustomerNotesByCustomer(req.params.customerId);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer notes" });
    }
  });

  app.post("/api/customer-notes", async (req, res) => {
    try {
      const noteData = insertCustomerNoteSchema.parse(req.body);
      const note = await storage.createCustomerNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create note" });
    }
  });

  app.patch("/api/customer-notes/:id", async (req, res) => {
    try {
      const updateData = insertCustomerNoteSchema.partial().parse(req.body);
      const note = await storage.updateCustomerNote(req.params.id, updateData);
      res.json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to update note" });
    }
  });

  app.delete("/api/customer-notes/:id", async (req, res) => {
    try {
      await storage.deleteCustomerNote(req.params.id);
      res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return res.status(404).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to delete note" });
    }
  });

  // Special route for kegs by customer
  app.get("/api/kegs/customer/:customerId", async (req, res) => {
    try {
      const kegs = await storage.getKegsByCustomer(req.params.customerId);
      res.json(kegs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer kegs" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const stats = await storage.getKegStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/analytics/overdue", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 7;
      const overdueKegs = await storage.getOverdueKegs(days);
      res.json(overdueKegs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch overdue kegs" });
    }
  });

  // Cider type routes
  app.get("/api/cider-types", async (req, res) => {
    try {
      const ciderTypes = await storage.getAllCiderTypes();
      res.json(ciderTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cider types" });
    }
  });

  app.get("/api/cider-types/:id", async (req, res) => {
    try {
      const ciderType = await storage.getCiderType(req.params.id);
      if (!ciderType) {
        return res.status(404).json({ message: "Cider type not found" });
      }
      res.json(ciderType);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cider type" });
    }
  });

  app.post("/api/cider-types", async (req, res) => {
    try {
      const validatedData = insertCiderTypeSchema.parse(req.body);
      const ciderType = await storage.createCiderType(validatedData);
      res.status(201).json(ciderType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create cider type" });
    }
  });

  app.patch("/api/cider-types/:id", async (req, res) => {
    try {
      const partialSchema = insertCiderTypeSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const ciderType = await storage.updateCiderType(req.params.id, validatedData);
      res.json(ciderType);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update cider type" });
    }
  });

  app.delete("/api/cider-types/:id", async (req, res) => {
    try {
      await storage.deleteCiderType(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cider type" });
    }
  });

  // Cider batch routes
  app.get("/api/cider-batches", async (req, res) => {
    try {
      const { ciderTypeId } = req.query;
      let batches;
      
      if (ciderTypeId) {
        batches = await storage.getCiderBatchesByType(ciderTypeId as string);
      } else {
        batches = await storage.getAllCiderBatches();
      }
      
      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cider batches" });
    }
  });

  app.get("/api/cider-batches/:id", async (req, res) => {
    try {
      const batch = await storage.getCiderBatch(req.params.id);
      if (!batch) {
        return res.status(404).json({ message: "Cider batch not found" });
      }
      res.json(batch);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cider batch" });
    }
  });

  app.post("/api/cider-batches", async (req, res) => {
    try {
      const validatedData = insertCiderBatchSchema.parse(req.body);
      const batch = await storage.createCiderBatch(validatedData);
      res.status(201).json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create cider batch" });
    }
  });

  app.patch("/api/cider-batches/:id", async (req, res) => {
    try {
      const partialSchema = insertCiderBatchSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const batch = await storage.updateCiderBatch(req.params.id, validatedData);
      res.json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update cider batch" });
    }
  });

  app.delete("/api/cider-batches/:id", async (req, res) => {
    try {
      await storage.deleteCiderBatch(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cider batch" });
    }
  });

  // Cider ingredient routes
  app.get("/api/cider-ingredients", async (req, res) => {
    try {
      const { batchId } = req.query;
      
      if (!batchId) {
        return res.status(400).json({ message: "batchId query parameter is required" });
      }
      
      const ingredients = await storage.getCiderIngredientsByBatch(batchId as string);
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cider ingredients" });
    }
  });

  app.post("/api/cider-ingredients", async (req, res) => {
    try {
      const validatedData = insertCiderIngredientSchema.parse(req.body);
      const ingredient = await storage.createCiderIngredient(validatedData);
      res.status(201).json(ingredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create cider ingredient" });
    }
  });

  app.patch("/api/cider-ingredients/:id", async (req, res) => {
    try {
      const partialSchema = insertCiderIngredientSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const ingredient = await storage.updateCiderIngredient(req.params.id, validatedData);
      res.json(ingredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update cider ingredient" });
    }
  });

  app.delete("/api/cider-ingredients/:id", async (req, res) => {
    try {
      await storage.deleteCiderIngredient(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cider ingredient" });
    }
  });

  // Fermentation batch routes
  app.get("/api/fermentation-batches", async (req, res) => {
    try {
      const batches = await storage.getAllFermentationBatches();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fermentation batches" });
    }
  });

  app.get("/api/fermentation-batches/:id", async (req, res) => {
    try {
      const batch = await storage.getFermentationBatch(req.params.id);
      if (!batch) {
        return res.status(404).json({ message: "Fermentation batch not found" });
      }
      res.json(batch);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch fermentation batch" });
    }
  });

  app.post("/api/fermentation-batches", async (req, res) => {
    try {
      const validatedData = insertFermentationBatchSchema.parse(req.body);
      const batch = await storage.createFermentationBatch(validatedData);
      res.status(201).json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create fermentation batch" });
    }
  });

  app.patch("/api/fermentation-batches/:id", async (req, res) => {
    try {
      const partialSchema = insertFermentationBatchSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      const batch = await storage.updateFermentationBatch(req.params.id, validatedData);
      res.json(batch);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update fermentation batch" });
    }
  });

  app.delete("/api/fermentation-batches/:id", async (req, res) => {
    try {
      await storage.deleteFermentationBatch(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete fermentation batch" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
