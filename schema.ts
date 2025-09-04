import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const kegs = pgTable("kegs", {
  id: varchar("id").primaryKey(),
  qrCode: text("qr_code").notNull().unique(),
  size: varchar("size", { enum: ["half_bbl", "sixth_bbl"] }).notNull(),
  status: varchar("status", { enum: ["full", "dirty", "clean", "deployed"] }).notNull().default("clean"),
  ciderType: text("cider_type"),
  location: text("location"),
  customerId: varchar("customer_id"),
  filledAt: timestamp("filled_at"),
  deployedAt: timestamp("deployed_at"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  contactPerson: text("contact_person"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kegId: varchar("keg_id").notNull(),
  action: varchar("action", { enum: ["filled", "deployed", "returned", "cleaned", "created"] }).notNull(),
  previousStatus: varchar("previous_status", { enum: ["full", "dirty", "clean", "deployed"] }),
  newStatus: varchar("new_status", { enum: ["full", "dirty", "clean", "deployed"] }).notNull(),
  location: text("location"),
  customerId: varchar("customer_id"),
  notes: text("notes"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  weekStartDate: timestamp("week_start_date").notNull(),
  status: varchar("status", { enum: ["pending", "confirmed", "fulfilled", "cancelled"] }).notNull().default("pending"),
  items: text("items").array(), // JSON array of order items: [{ciderType: "Apple", quantity: 2}, {ciderType: "DNA", quantity: 0}]
  totalKegs: integer("total_kegs").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerNotes = pgTable("customer_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { enum: ["interaction", "order", "delivery", "payment", "general"] }).notNull().default("general"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ciderTypes = pgTable("cider_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  style: varchar("style"), // IPA, Lager, Stout, etc.
  abv: decimal("abv", { precision: 4, scale: 2 }), // Alcohol by volume
  ibu: integer("ibu"), // International Bitterness Units
  srm: decimal("srm", { precision: 4, scale: 1 }), // Standard Reference Method (color)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ciderBatches = pgTable("cider_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ciderTypeId: varchar("cider_type_id").notNull(),
  batchNumber: varchar("batch_number").notNull(),
  date: timestamp("date"),
  brix: decimal("brix", { precision: 5, scale: 2 }),
  
  // Liquid ingredients (up to 5 types)
  liquidIngredient1Type: varchar("liquid_ingredient_1_type"),
  liquidIngredient1Volume: decimal("liquid_ingredient_1_volume", { precision: 8, scale: 2 }),
  liquidIngredient2Type: varchar("liquid_ingredient_2_type"),
  liquidIngredient2Volume: decimal("liquid_ingredient_2_volume", { precision: 8, scale: 2 }),
  liquidIngredient3Type: varchar("liquid_ingredient_3_type"),
  liquidIngredient3Volume: decimal("liquid_ingredient_3_volume", { precision: 8, scale: 2 }),
  liquidIngredient4Type: varchar("liquid_ingredient_4_type"),
  liquidIngredient4Volume: decimal("liquid_ingredient_4_volume", { precision: 8, scale: 2 }),
  liquidIngredient5Type: varchar("liquid_ingredient_5_type"),
  liquidIngredient5Volume: decimal("liquid_ingredient_5_volume", { precision: 8, scale: 2 }),
  
  // Juice ingredients (up to 3 types)
  juice1Type: varchar("juice_1_type"),
  juice1Volume: decimal("juice_1_volume", { precision: 8, scale: 2 }),
  juice2Type: varchar("juice_2_type"),
  juice2Volume: decimal("juice_2_volume", { precision: 8, scale: 2 }),
  juice3Type: varchar("juice_3_type"),
  juice3Volume: decimal("juice_3_volume", { precision: 8, scale: 2 }),
  
  // Sugar and other ingredients
  poundsSugar: decimal("pounds_sugar", { precision: 8, scale: 2 }),
  additionalIngredientNotes: text("additional_ingredient_notes"),
  batchNotes: text("batch_notes"),
  
  // Packaging tracking
  halfBarrelsPackaged: integer("half_barrels_packaged").default(0),
  sixthBarrelsPackaged: integer("sixth_barrels_packaged").default(0),
  cansFilled: jsonb("cans_filled"), // Array of {date, quantity} objects
  productLostDuringPackaging: decimal("product_lost_during_packaging", { precision: 8, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const ciderIngredients = pgTable("cider_ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchId: varchar("batch_id").notNull(),
  ingredientName: varchar("ingredient_name").notNull(),
  ingredientType: varchar("ingredient_type", { enum: ["malt", "hops", "yeast", "adjunct", "fruit", "spice", "other"] }).notNull(),
  quantity: decimal("quantity", { precision: 8, scale: 3 }),
  unit: varchar("unit"), // lbs, oz, grams, etc.
  supplier: varchar("supplier"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fermentation batches table
export const fermentationBatches = pgTable("fermentation_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fermentationId: varchar("fermentation_id").notNull(),
  date: timestamp("date").notNull(),
  volume: decimal("volume", { precision: 10, scale: 2 }).notNull(),
  incomingJuiceId: varchar("incoming_juice_id"),
  incomingJuiceVolume: decimal("incoming_juice_volume", { precision: 10, scale: 2 }),
  juiceSource: varchar("juice_source"),
  brix: decimal("brix", { precision: 5, scale: 2 }),
  abv: decimal("abv", { precision: 5, scale: 2 }),
  sulfiteAdded: decimal("sulfite_added", { precision: 8, scale: 2 }), // grams
  yeastStrain: varchar("yeast_strain"),
  yeastWeight: decimal("yeast_weight", { precision: 8, scale: 2 }), // grams
  ph: decimal("ph", { precision: 4, scale: 2 }),
  titratableAcidity: decimal("titratable_acidity", { precision: 6, scale: 2 }),
  copperSulfateAdded: decimal("copper_sulfate_added", { precision: 8, scale: 2 }), // ml
  rackingDates: text("racking_dates").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKegSchema = createInsertSchema(kegs).omit({
  createdAt: true,
  lastUpdated: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  timestamp: true,
});

export const insertOrderSchema = createInsertSchema(orders)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    weekStartDate: z.date(),
  });

export const insertCustomerNoteSchema = createInsertSchema(customerNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCiderTypeSchema = createInsertSchema(ciderTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCiderBatchSchema = createInsertSchema(ciderBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCiderIngredientSchema = createInsertSchema(ciderIngredients).omit({
  id: true,
  createdAt: true,
});

export const insertFermentationBatchSchema = createInsertSchema(fermentationBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertKeg = z.infer<typeof insertKegSchema>;
export type Keg = typeof kegs.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertCustomerNote = z.infer<typeof insertCustomerNoteSchema>;
export type CustomerNote = typeof customerNotes.$inferSelect;
export type InsertCiderType = z.infer<typeof insertCiderTypeSchema>;
export type CiderType = typeof ciderTypes.$inferSelect;
export type InsertCiderBatch = z.infer<typeof insertCiderBatchSchema>;
export type CiderBatch = typeof ciderBatches.$inferSelect;
export type InsertCiderIngredient = z.infer<typeof insertCiderIngredientSchema>;
export type CiderIngredient = typeof ciderIngredients.$inferSelect;
export type InsertFermentationBatch = z.infer<typeof insertFermentationBatchSchema>;
export type FermentationBatch = typeof fermentationBatches.$inferSelect;

export const updateKegStatusSchema = z.object({
  status: z.enum(["full", "dirty", "clean", "deployed"]),
  location: z.string().optional(),
  customerId: z.string().optional(),
  ciderType: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  // Clean kegs cannot have cider type
  if (data.status === "clean" && data.ciderType && data.ciderType.trim() !== "") {
    return false;
  }
  // Full kegs must have cider type
  if (data.status === "full" && (!data.ciderType || data.ciderType.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Clean kegs cannot have beer type. Full kegs must have beer type.",
  path: ["beerType"]
});

export type UpdateKegStatus = z.infer<typeof updateKegStatusSchema>;
