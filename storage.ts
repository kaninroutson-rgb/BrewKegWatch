import { type Keg, type InsertKeg, type Customer, type InsertCustomer, type Activity, type InsertActivity, type UpdateKegStatus, type Order, type InsertOrder, type CustomerNote, type InsertCustomerNote, type CiderType, type InsertCiderType, type CiderBatch, type InsertCiderBatch, type CiderIngredient, type InsertCiderIngredient, type FermentationBatch, type InsertFermentationBatch } from "@shared/schema";
import { randomUUID } from "crypto";

// QR code generation utilities
function generateKegId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `K-${randomNum}`;
}

function generateQrCode(kegId: string): string {
  return `SK${kegId.replace('K-', '')}`;
}

export interface IStorage {
  // Keg operations
  getKeg(id: string): Promise<Keg | undefined>;
  getKegByQrCode(qrCode: string): Promise<Keg | undefined>;
  getAllKegs(): Promise<Keg[]>;
  getKegsByStatus(status: string): Promise<Keg[]>;
  getKegsByCustomer(customerId: string): Promise<Keg[]>;
  createKeg(keg: InsertKeg): Promise<Keg>;
  updateKegStatus(id: string, update: UpdateKegStatus): Promise<Keg>;
  
  // Customer operations
  getCustomer(id: string): Promise<Customer | undefined>;
  getAllCustomers(): Promise<Customer[]>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  getKegsByCustomer(customerId: string): Promise<Keg[]>;
  
  // Activity operations
  getActivitiesByKeg(kegId: string): Promise<Activity[]>;
  getRecentActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Order operations
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrdersByWeek(weekStartDate: Date): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order>;
  deleteOrder(id: string): Promise<void>;
  
  // Customer note operations
  getCustomerNote(id: string): Promise<CustomerNote | undefined>;
  getCustomerNotesByCustomer(customerId: string): Promise<CustomerNote[]>;
  getAllCustomerNotes(): Promise<CustomerNote[]>;
  createCustomerNote(note: InsertCustomerNote): Promise<CustomerNote>;
  updateCustomerNote(id: string, note: Partial<InsertCustomerNote>): Promise<CustomerNote>;
  deleteCustomerNote(id: string): Promise<void>;
  
  // Cider type operations
  getCiderType(id: string): Promise<CiderType | undefined>;
  getAllCiderTypes(): Promise<CiderType[]>;
  createCiderType(ciderType: InsertCiderType): Promise<CiderType>;
  updateCiderType(id: string, ciderType: Partial<InsertCiderType>): Promise<CiderType>;
  deleteCiderType(id: string): Promise<void>;

  // Cider batch operations
  getCiderBatch(id: string): Promise<CiderBatch | undefined>;
  getCiderBatchesByType(ciderTypeId: string): Promise<CiderBatch[]>;
  getAllCiderBatches(): Promise<CiderBatch[]>;
  createCiderBatch(batch: InsertCiderBatch): Promise<CiderBatch>;
  updateCiderBatch(id: string, batch: Partial<InsertCiderBatch>): Promise<CiderBatch>;
  deleteCiderBatch(id: string): Promise<void>;

  // Cider ingredient operations
  getCiderIngredient(id: string): Promise<CiderIngredient | undefined>;
  getCiderIngredientsByBatch(batchId: string): Promise<CiderIngredient[]>;
  getAllCiderIngredients(): Promise<CiderIngredient[]>;
  createCiderIngredient(ingredient: InsertCiderIngredient): Promise<CiderIngredient>;
  updateCiderIngredient(id: string, ingredient: Partial<InsertCiderIngredient>): Promise<CiderIngredient>;
  deleteCiderIngredient(id: string): Promise<void>;

  // Fermentation batch operations
  getFermentationBatch(id: string): Promise<FermentationBatch | undefined>;
  getAllFermentationBatches(): Promise<FermentationBatch[]>;
  createFermentationBatch(batch: InsertFermentationBatch): Promise<FermentationBatch>;
  updateFermentationBatch(id: string, batch: Partial<InsertFermentationBatch>): Promise<FermentationBatch>;
  deleteFermentationBatch(id: string): Promise<void>;

  // Analytics operations (missing methods)
  getKegStats(): Promise<{ total: number; full: number; dirty: number; clean: number; deployed: number }>;
  getOverdueKegs(): Promise<Keg[]>;
  getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]>;
}

export class MemStorage implements IStorage {
  private kegs = new Map<string, Keg>();
  private customers = new Map<string, Customer>();
  private activities = new Map<string, Activity>();
  private orders = new Map<string, Order>();
  private customerNotes = new Map<string, CustomerNote>();
  private ciderTypes = new Map<string, CiderType>();
  private ciderBatches = new Map<string, CiderBatch>();
  private ciderIngredients = new Map<string, CiderIngredient>();
  private fermentationBatches = new Map<string, FermentationBatch>();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize kegs
    const kegData = [
      { id: generateKegId(), size: "half_bbl" as const, status: "clean" as const },
      { id: generateKegId(), size: "half_bbl" as const, status: "dirty" as const },
      { id: generateKegId(), size: "sixth_bbl" as const, status: "full" as const, ciderType: "Apple", location: "Warehouse A" },
      { id: generateKegId(), size: "sixth_bbl" as const, status: "deployed" as const, ciderType: "Peach", location: "Bar Downtown", customerId: "customer-1" },
      { id: generateKegId(), size: "half_bbl" as const, status: "clean" as const },
    ];

    kegData.forEach(data => {
      const keg: Keg = {
        ...data,
        qrCode: generateQrCode(data.id),
        ciderType: data.ciderType || null,
        location: data.location || null,
        customerId: data.customerId || null,
        filledAt: data.status === "full" ? new Date() : null,
        deployedAt: data.status === "deployed" ? new Date() : null,
        lastUpdated: new Date(),
        createdAt: new Date(),
      };
      this.kegs.set(data.id, keg);
    });

    // Initialize customers
    const customerData = [
      { id: "customer-1", name: "The Tipsy Tavern", email: "orders@tipsytavern.com", phone: "555-0101", contactPerson: "Mike Johnson" },
      { id: "customer-2", name: "Brewhouse Bistro", email: "contact@brewhouse.com", phone: "555-0102", contactPerson: "Sarah Chen" },
      { id: "customer-3", name: "The Local Pub", email: "manager@localpub.com", phone: "555-0103", contactPerson: "David Wilson" },
      { id: "customer-4", name: "Craft Corner", email: "info@craftcorner.com", phone: "555-0104", contactPerson: "Emma Davis" },
    ];

    customerData.forEach(data => {
      const customer: Customer = {
        ...data,
        address: null,
        notes: null,
        isActive: true,
        createdAt: new Date(),
      };
      this.customers.set(data.id, customer);
    });

    // Initialize cider types with detailed cider information
    const ciderTypesData = [
      { name: "Prickly Pear", description: "A unique desert cider featuring the sweet, refreshing taste of prickly pear cactus", style: "Fruit Cider", abv: "6.2", ibu: 8, srm: "4.5", isActive: true },
      { name: "Peach", description: "Sweet and juicy peach cider with notes of summer orchard fruit", style: "Fruit Cider", abv: "5.8", ibu: 10, srm: "5.2", isActive: true },
      { name: "Apple", description: "Classic apple cider with crisp orchard fruit and a hint of spice", style: "Traditional Cider", abv: "5.0", ibu: 10, srm: "6.2", isActive: true },
      { name: "Rhubarb", description: "Tart and refreshing rhubarb cider with a perfect balance of sweet and sour", style: "Fruit Cider", abv: "5.5", ibu: 12, srm: "3.8", isActive: true },
      { name: "Seasonal Berry Blend", description: "Limited edition blend of seasonal berries creating a complex, fruity profile", style: "Specialty Cider", abv: "6.0", ibu: 9, srm: "7.1", isActive: false },
    ];

    ciderTypesData.forEach(data => {
      const id = randomUUID();
      const ciderType: CiderType = {
        id,
        name: data.name,
        description: data.description,
        style: data.style,
        abv: data.abv,
        ibu: data.ibu,
        srm: data.srm,
        isActive: data.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.ciderTypes.set(id, ciderType);
    });

    // Add sample activities
    const activityData = [
      { kegId: kegData[0].id, action: "created" as const, newStatus: "clean" as const },
      { kegId: kegData[1].id, action: "created" as const, newStatus: "dirty" as const },
      { kegId: kegData[2].id, action: "filled" as const, previousStatus: "clean" as const, newStatus: "full" as const },
      { kegId: kegData[3].id, action: "deployed" as const, previousStatus: "full" as const, newStatus: "deployed" as const },
    ];

    activityData.forEach(data => {
      const activity: Activity = {
        id: randomUUID(),
        kegId: data.kegId,
        action: data.action,
        previousStatus: data.previousStatus || null,
        newStatus: data.newStatus,
        location: null,
        customerId: null,
        notes: null,
        timestamp: new Date(),
      };
      this.activities.set(activity.id, activity);
    });

    console.log(`Initialized StoicKegs with ${this.kegs.size} kegs, ${this.customers.size} customers, and ${this.ciderTypes.size} cider types`);
  }

  // Keg operations
  async getKeg(id: string): Promise<Keg | undefined> {
    return this.kegs.get(id);
  }

  async getKegByQrCode(qrCode: string): Promise<Keg | undefined> {
    return Array.from(this.kegs.values()).find(keg => keg.qrCode === qrCode);
  }

  async getAllKegs(): Promise<Keg[]> {
    return Array.from(this.kegs.values()).sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }

  async getKegsByStatus(status: string): Promise<Keg[]> {
    return Array.from(this.kegs.values())
      .filter(keg => keg.status === status)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  async getKegsByCustomer(customerId: string): Promise<Keg[]> {
    return Array.from(this.kegs.values())
      .filter(keg => keg.customerId === customerId)
      .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
  }

  async createKeg(insertKeg: InsertKeg): Promise<Keg> {
    const keg: Keg = {
      ...insertKeg,
      lastUpdated: new Date(),
      createdAt: new Date(),
    };
    this.kegs.set(insertKeg.id, keg);
    return keg;
  }

  async updateKegStatus(id: string, update: UpdateKegStatus): Promise<Keg> {
    const keg = this.kegs.get(id);
    if (!keg) {
      throw new Error("Keg not found");
    }

    const updatedKeg: Keg = {
      ...keg,
      ...update,
      lastUpdated: new Date(),
      filledAt: update.status === "full" ? new Date() : keg.filledAt,
      deployedAt: update.status === "deployed" ? new Date() : keg.deployedAt,
    };

    this.kegs.set(id, updatedKeg);
    return updatedKeg;
  }

  // Customer operations
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      id,
      ...insertCustomer,
      createdAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const customer = this.customers.get(id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const updatedCustomer: Customer = {
      ...customer,
      ...customerData,
    };

    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  // Activity operations
  async getActivitiesByKeg(kegId: string): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.kegId === kegId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getRecentActivities(limit: number = 50): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      id,
      ...insertActivity,
      timestamp: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  // Order operations
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter(order => order.customerId === customerId)
      .sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());
  }

  async getOrdersByWeek(weekStartDate: Date): Promise<Order[]> {
    const weekStart = new Date(weekStartDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return Array.from(this.orders.values())
      .filter(order => {
        const orderDate = new Date(order.weekStartDate);
        return orderDate >= weekStart && orderDate < weekEnd;
      });
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values())
      .sort((a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      id,
      ...insertOrder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) {
      throw new Error("Order not found");
    }

    const updatedOrder: Order = {
      ...order,
      ...orderData,
      updatedAt: new Date(),
    };

    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<void> {
    this.orders.delete(id);
  }

  // Customer note operations
  async getCustomerNote(id: string): Promise<CustomerNote | undefined> {
    return this.customerNotes.get(id);
  }

  async getCustomerNotesByCustomer(customerId: string): Promise<CustomerNote[]> {
    return Array.from(this.customerNotes.values())
      .filter(note => note.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllCustomerNotes(): Promise<CustomerNote[]> {
    return Array.from(this.customerNotes.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createCustomerNote(insertNote: InsertCustomerNote): Promise<CustomerNote> {
    const id = randomUUID();
    const note: CustomerNote = {
      id,
      ...insertNote,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.customerNotes.set(id, note);
    return note;
  }

  async updateCustomerNote(id: string, noteData: Partial<InsertCustomerNote>): Promise<CustomerNote> {
    const note = this.customerNotes.get(id);
    if (!note) {
      throw new Error("Customer note not found");
    }

    const updatedNote: CustomerNote = {
      ...note,
      ...noteData,
      updatedAt: new Date(),
    };

    this.customerNotes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteCustomerNote(id: string): Promise<void> {
    this.customerNotes.delete(id);
  }

  // Cider type operations
  async getCiderType(id: string): Promise<CiderType | undefined> {
    return this.ciderTypes.get(id);
  }

  async getAllCiderTypes(): Promise<CiderType[]> {
    return Array.from(this.ciderTypes.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCiderType(insertCiderType: InsertCiderType): Promise<CiderType> {
    const id = randomUUID();
    const ciderType: CiderType = {
      id,
      ...insertCiderType,
      description: insertCiderType.description ?? null,
      style: insertCiderType.style ?? null,
      abv: insertCiderType.abv ?? null,
      ibu: insertCiderType.ibu ?? null,
      srm: insertCiderType.srm ?? null,
      isActive: insertCiderType.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ciderTypes.set(id, ciderType);
    return ciderType;
  }

  async updateCiderType(id: string, data: Partial<InsertCiderType>): Promise<CiderType> {
    const ciderType = this.ciderTypes.get(id);
    if (!ciderType) {
      throw new Error("Cider type not found");
    }

    const updatedCiderType: CiderType = {
      ...ciderType,
      ...data,
      updatedAt: new Date(),
    };

    this.ciderTypes.set(id, updatedCiderType);
    return updatedCiderType;
  }

  async deleteCiderType(id: string): Promise<void> {
    this.ciderTypes.delete(id);
  }

  // Cider batch operations
  async getCiderBatch(id: string): Promise<CiderBatch | undefined> {
    return this.ciderBatches.get(id);
  }

  async getCiderBatchesByType(ciderTypeId: string): Promise<CiderBatch[]> {
    return Array.from(this.ciderBatches.values())
      .filter(batch => batch.ciderTypeId === ciderTypeId)
      .sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0;
        const bTime = b.date ? new Date(b.date).getTime() : 0;
        return bTime - aTime;
      });
  }

  async getAllCiderBatches(): Promise<CiderBatch[]> {
    return Array.from(this.ciderBatches.values())
      .sort((a, b) => {
        const aTime = a.date ? new Date(a.date).getTime() : 0;
        const bTime = b.date ? new Date(b.date).getTime() : 0;
        return bTime - aTime;
      });
  }

  async createCiderBatch(insertBatch: InsertCiderBatch): Promise<CiderBatch> {
    const id = randomUUID();
    const batch: CiderBatch = {
      id,
      ...insertBatch,
      date: insertBatch.date ?? null,
      brix: insertBatch.brix ?? null,
      liquidIngredient1Type: insertBatch.liquidIngredient1Type ?? null,
      liquidIngredient1Volume: insertBatch.liquidIngredient1Volume ?? null,
      liquidIngredient2Type: insertBatch.liquidIngredient2Type ?? null,
      liquidIngredient2Volume: insertBatch.liquidIngredient2Volume ?? null,
      liquidIngredient3Type: insertBatch.liquidIngredient3Type ?? null,
      liquidIngredient3Volume: insertBatch.liquidIngredient3Volume ?? null,
      liquidIngredient4Type: insertBatch.liquidIngredient4Type ?? null,
      liquidIngredient4Volume: insertBatch.liquidIngredient4Volume ?? null,
      liquidIngredient5Type: insertBatch.liquidIngredient5Type ?? null,
      liquidIngredient5Volume: insertBatch.liquidIngredient5Volume ?? null,
      juice1Type: insertBatch.juice1Type ?? null,
      juice1Volume: insertBatch.juice1Volume ?? null,
      juice2Type: insertBatch.juice2Type ?? null,
      juice2Volume: insertBatch.juice2Volume ?? null,
      juice3Type: insertBatch.juice3Type ?? null,
      juice3Volume: insertBatch.juice3Volume ?? null,
      poundsSugar: insertBatch.poundsSugar ?? null,
      additionalIngredientNotes: insertBatch.additionalIngredientNotes ?? null,
      batchNotes: insertBatch.batchNotes ?? null,
      halfBarrelsPackaged: insertBatch.halfBarrelsPackaged ?? 0,
      sixthBarrelsPackaged: insertBatch.sixthBarrelsPackaged ?? 0,
      cansFilled: insertBatch.cansFilled ?? null,
      productLostDuringPackaging: insertBatch.productLostDuringPackaging ?? "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.ciderBatches.set(id, batch);
    return batch;
  }

  async updateCiderBatch(id: string, data: Partial<InsertCiderBatch>): Promise<CiderBatch> {
    const batch = this.ciderBatches.get(id);
    if (!batch) {
      throw new Error("Cider batch not found");
    }

    const updatedBatch: CiderBatch = {
      ...batch,
      ...data,
      updatedAt: new Date(),
    };

    this.ciderBatches.set(id, updatedBatch);
    return updatedBatch;
  }

  async deleteCiderBatch(id: string): Promise<void> {
    this.ciderBatches.delete(id);
  }

  // Cider ingredient operations
  async getCiderIngredient(id: string): Promise<CiderIngredient | undefined> {
    return this.ciderIngredients.get(id);
  }

  async getCiderIngredientsByBatch(batchId: string): Promise<CiderIngredient[]> {
    return Array.from(this.ciderIngredients.values())
      .filter(ingredient => ingredient.batchId === batchId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllCiderIngredients(): Promise<CiderIngredient[]> {
    return Array.from(this.ciderIngredients.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createCiderIngredient(insertIngredient: InsertCiderIngredient): Promise<CiderIngredient> {
    const id = randomUUID();
    const ingredient: CiderIngredient = {
      id,
      ...insertIngredient,
      quantity: insertIngredient.quantity ?? null,
      unit: insertIngredient.unit ?? null,
      supplier: insertIngredient.supplier ?? null,
      notes: insertIngredient.notes ?? null,
      createdAt: new Date(),
    };
    this.ciderIngredients.set(id, ingredient);
    return ingredient;
  }

  async updateCiderIngredient(id: string, data: Partial<InsertCiderIngredient>): Promise<CiderIngredient> {
    const ingredient = this.ciderIngredients.get(id);
    if (!ingredient) {
      throw new Error("Cider ingredient not found");
    }

    const updatedIngredient: CiderIngredient = {
      ...ingredient,
      ...data,
    };

    this.ciderIngredients.set(id, updatedIngredient);
    return updatedIngredient;
  }

  async deleteCiderIngredient(id: string): Promise<void> {
    this.ciderIngredients.delete(id);
  }

  // Fermentation batch operations
  async getFermentationBatch(id: string): Promise<FermentationBatch | undefined> {
    return this.fermentationBatches.get(id);
  }

  async getAllFermentationBatches(): Promise<FermentationBatch[]> {
    return Array.from(this.fermentationBatches.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async createFermentationBatch(insertBatch: InsertFermentationBatch): Promise<FermentationBatch> {
    const id = randomUUID();
    const batch: FermentationBatch = {
      id,
      ...insertBatch,
      incomingJuiceId: insertBatch.incomingJuiceId ?? null,
      incomingJuiceVolume: insertBatch.incomingJuiceVolume ?? null,
      juiceSource: insertBatch.juiceSource ?? null,
      brix: insertBatch.brix ?? null,
      abv: insertBatch.abv ?? null,
      sulfiteAdded: insertBatch.sulfiteAdded ?? null,
      yeastStrain: insertBatch.yeastStrain ?? null,
      yeastWeight: insertBatch.yeastWeight ?? null,
      ph: insertBatch.ph ?? null,
      titratableAcidity: insertBatch.titratableAcidity ?? null,
      copperSulfateAdded: insertBatch.copperSulfateAdded ?? null,
      rackingDates: insertBatch.rackingDates ?? null,
      notes: insertBatch.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fermentationBatches.set(id, batch);
    return batch;
  }

  async updateFermentationBatch(id: string, data: Partial<InsertFermentationBatch>): Promise<FermentationBatch> {
    const batch = this.fermentationBatches.get(id);
    if (!batch) {
      throw new Error("Fermentation batch not found");
    }

    const updatedBatch: FermentationBatch = {
      ...batch,
      ...data,
      updatedAt: new Date(),
    };

    this.fermentationBatches.set(id, updatedBatch);
    return updatedBatch;
  }

  async deleteFermentationBatch(id: string): Promise<void> {
    this.fermentationBatches.delete(id);
  }

  // Analytics operations
  async getKegStats(): Promise<{ total: number; full: number; dirty: number; clean: number; deployed: number }> {
    const kegs = Array.from(this.kegs.values());
    return {
      total: kegs.length,
      full: kegs.filter(k => k.status === 'full').length,
      dirty: kegs.filter(k => k.status === 'dirty').length,
      clean: kegs.filter(k => k.status === 'clean').length,
      deployed: kegs.filter(k => k.status === 'deployed').length,
    };
  }

  async getOverdueKegs(): Promise<Keg[]> {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return Array.from(this.kegs.values()).filter(keg => 
      keg.status === 'deployed' && 
      keg.deployedAt && 
      new Date(keg.deployedAt) < threeDaysAgo
    );
  }

  async getOrdersByDateRange(startDate: Date, endDate: Date): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(order => {
      const orderDate = new Date(order.weekStartDate);
      return orderDate >= startDate && orderDate <= endDate;
    });
  }
}

export const storage = new MemStorage();