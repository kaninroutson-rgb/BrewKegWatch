import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit, Save, X, Plus, Package, Calendar, MapPin, Phone, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MobileHeader from "@/components/mobile-header";
import BottomNavigation from "@/components/bottom-navigation";
import KegCard from "@/components/keg-card";
import KegDetailsModal from "@/components/keg-details-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Customer, Keg, Order, CustomerNote, InsertOrder, InsertCustomerNote } from "@shared/schema";

const BEER_TYPES = ["Prickly Pear", "Peach", "Apple", "Rhubarb"];

export default function CustomerDetail() {
  const [, params] = useRoute("/customers/:id");
  const customerId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Partial<Customer>>({});
  const [selectedKeg, setSelectedKeg] = useState<Keg | null>(null);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteCategory, setNoteCategory] = useState("general");

  // Fetch customer data
  const { data: customer, isLoading: customerLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
    enabled: !!customerId,
  });

  // Fetch deployed kegs for this customer
  const { data: deployedKegs = [] } = useQuery<Keg[]>({
    queryKey: ["/api/kegs", "customer", customerId],
    enabled: !!customerId,
  });

  // Fetch orders for this customer
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders", "customer", customerId],
    enabled: !!customerId,
  });

  // Fetch notes for this customer
  const { data: notes = [] } = useQuery<CustomerNote[]>({
    queryKey: ["/api/customer-notes", customerId],
    enabled: !!customerId,
  });

  // Update customer mutation
  const updateCustomerMutation = useMutation({
    mutationFn: async (updates: Partial<Customer>) => {
      return apiRequest("PATCH", `/api/customers/${customerId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId] });
      setIsEditing(false);
      toast({ title: "Customer updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update customer", variant: "destructive" });
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (order: InsertOrder) => {
      return apiRequest("POST", "/api/orders", order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders", "customer", customerId] });
      setShowOrderForm(false);
      toast({ title: "Order created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create order", variant: "destructive" });
    },
  });

  // Create note mutation
  const createNoteMutation = useMutation({
    mutationFn: async (note: InsertCustomerNote) => {
      return apiRequest("POST", "/api/customer-notes", note);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-notes", customerId] });
      setShowNoteForm(false);
      setNewNote("");
      setNoteCategory("general");
      toast({ title: "Note added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  useEffect(() => {
    if (customer) {
      setEditedCustomer(customer);
    }
  }, [customer]);

  if (customerLoading) {
    return <div className="min-h-screen-ios bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!customer) {
    return <div className="min-h-screen-ios bg-gray-50 flex items-center justify-center">Customer not found</div>;
  }

  const handleSaveCustomer = () => {
    updateCustomerMutation.mutate(editedCustomer);
  };

  const handleCancelEdit = () => {
    setEditedCustomer(customer);
    setIsEditing(false);
  };

  const handleCreateOrder = (orderData: any) => {
    createOrderMutation.mutate(orderData);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    createNoteMutation.mutate({
      customerId: customerId!,
      content: newNote.trim(),
      category: noteCategory as "interaction" | "order" | "delivery" | "payment" | "general",
    });
  };

  return (
    <div className="min-h-screen-ios bg-gray-50">
      <MobileHeader title={customer.name} />

      <main className="px-4 py-6 pb-20">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="kegs">Kegs</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Customer Information Tab */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Details
                </CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    data-testid="button-edit-customer"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      data-testid="button-cancel-edit"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveCustomer}
                      disabled={updateCustomerMutation.isPending}
                      data-testid="button-save-customer"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="name">Business Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editedCustomer.name || ""}
                        onChange={(e) => setEditedCustomer(prev => ({ ...prev, name: e.target.value }))}
                        data-testid="input-customer-name"
                      />
                    ) : (
                      <p className="text-sm font-medium" data-testid="text-customer-name">{customer.name}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="contact-person">Contact Person</Label>
                    {isEditing ? (
                      <Input
                        id="contact-person"
                        value={editedCustomer.contactPerson || ""}
                        onChange={(e) => setEditedCustomer(prev => ({ ...prev, contactPerson: e.target.value }))}
                        data-testid="input-contact-person"
                      />
                    ) : (
                      <p className="text-sm" data-testid="text-contact-person">{customer.contactPerson || "Not specified"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={editedCustomer.email || ""}
                        onChange={(e) => setEditedCustomer(prev => ({ ...prev, email: e.target.value }))}
                        data-testid="input-customer-email"
                      />
                    ) : (
                      <p className="text-sm" data-testid="text-customer-email">{customer.email || "Not specified"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    {isEditing ? (
                      <Input
                        id="phone"
                        value={editedCustomer.phone || ""}
                        onChange={(e) => setEditedCustomer(prev => ({ ...prev, phone: e.target.value }))}
                        data-testid="input-customer-phone"
                      />
                    ) : (
                      <p className="text-sm" data-testid="text-customer-phone">{customer.phone || "Not specified"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    {isEditing ? (
                      <Textarea
                        id="address"
                        value={editedCustomer.address || ""}
                        onChange={(e) => setEditedCustomer(prev => ({ ...prev, address: e.target.value }))}
                        data-testid="input-customer-address"
                      />
                    ) : (
                      <p className="text-sm" data-testid="text-customer-address">{customer.address || "Not specified"}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="notes">Account Notes</Label>
                    {isEditing ? (
                      <Textarea
                        id="notes"
                        value={editedCustomer.notes || ""}
                        onChange={(e) => setEditedCustomer(prev => ({ ...prev, notes: e.target.value }))}
                        data-testid="input-customer-notes"
                        placeholder="General notes about this customer..."
                      />
                    ) : (
                      <p className="text-sm" data-testid="text-customer-notes">{customer.notes || "No notes"}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deployed Kegs Tab */}
          <TabsContent value="kegs" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5" />
                Deployed Kegs ({deployedKegs.length})
              </h3>
            </div>
            
            {deployedKegs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No kegs currently deployed to this customer</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {deployedKegs.map((keg) => (
                  <KegCard
                    key={keg.id}
                    keg={keg}
                    onClick={() => setSelectedKeg(keg)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weekly Orders
              </h3>
              <Button
                onClick={() => setShowOrderForm(true)}
                size="sm"
                data-testid="button-create-order"
              >
                <Plus className="w-4 h-4 mr-1" />
                New Order
              </Button>
            </div>

            {orders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                  <Button
                    onClick={() => setShowOrderForm(true)}
                    className="mt-4"
                    data-testid="button-create-first-order"
                  >
                    Create First Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Interaction Notes</h3>
              <Button
                onClick={() => setShowNoteForm(true)}
                size="sm"
                data-testid="button-add-note"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Note
              </Button>
            </div>

            {notes.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">No notes yet</p>
                  <Button
                    onClick={() => setShowNoteForm(true)}
                    className="mt-4"
                    data-testid="button-add-first-note"
                  >
                    Add First Note
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />

      {/* Keg Details Modal */}
      {selectedKeg && (
        <KegDetailsModal
          keg={selectedKeg}
          open={!!selectedKeg}
          onClose={() => setSelectedKeg(null)}
        />
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <OrderFormModal
          customerId={customerId!}
          open={showOrderForm}
          onOpenChange={setShowOrderForm}
          onSubmit={handleCreateOrder}
        />
      )}

      {/* Note Form Modal */}
      {showNoteForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Note</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="note-category">Category</Label>
                <Select value={noteCategory} onValueChange={setNoteCategory}>
                  <SelectTrigger data-testid="select-note-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="interaction">Interaction</SelectItem>
                    <SelectItem value="order">Order</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="note-content">Note</Label>
                <Textarea
                  id="note-content"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note..."
                  data-testid="input-note-content"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNoteForm(false)}
                  className="flex-1"
                  data-testid="button-cancel-note"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || createNoteMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-note"
                >
                  {createNoteMutation.isPending ? "Adding..." : "Add Note"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Order Card Component
function OrderCard({ order }: { order: Order }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "fulfilled": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const items = order.items ? order.items.map(item => JSON.parse(item)) : [];

  return (
    <Card data-testid={`card-order-${order.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">
              Week of {new Date(order.weekStartDate).toLocaleDateString()}
            </span>
          </div>
          <Badge className={getStatusColor(order.status)} data-testid={`badge-order-status-${order.status}`}>
            {order.status}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Total Kegs:</span>
            <span className="text-sm font-medium" data-testid={`text-total-kegs-${order.id}`}>{order.totalKegs}</span>
          </div>
          
          {items.length > 0 && (
            <div>
              <span className="text-sm text-gray-600">Items:</span>
              <div className="mt-1 space-y-1">
                {items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.beerType === "DNA" ? "Don't Need Anything" : item.beerType}</span>
                    <span className="font-medium">{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {order.notes && (
            <div>
              <span className="text-sm text-gray-600">Notes:</span>
              <p className="text-sm mt-1" data-testid={`text-order-notes-${order.id}`}>{order.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Note Card Component
function NoteCard({ note }: { note: CustomerNote }) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "interaction": return "bg-blue-100 text-blue-800";
      case "order": return "bg-green-100 text-green-800";
      case "delivery": return "bg-purple-100 text-purple-800";
      case "payment": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card data-testid={`card-note-${note.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge className={getCategoryColor(note.category)} data-testid={`badge-note-category-${note.category}`}>
            {note.category}
          </Badge>
          <span className="text-xs text-gray-500">
            {new Date(note.createdAt!).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm" data-testid={`text-note-content-${note.id}`}>{note.content}</p>
      </CardContent>
    </Card>
  );
}

// Order Form Modal Component
function OrderFormModal({ 
  customerId, 
  open, 
  onOpenChange, 
  onSubmit 
}: { 
  customerId: string; 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSubmit: (orderData: any) => void;
}) {
  const [weekStartDate, setWeekStartDate] = useState(() => {
    // Get next Monday
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilNextMonday = (8 - dayOfWeek) % 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);
    return nextMonday.toISOString().split('T')[0];
  });
  
  const [orderItems, setOrderItems] = useState([
    { beerType: "Prickly Pear", quantity: 0 },
    { beerType: "Peach", quantity: 0 },
    { beerType: "Apple", quantity: 0 },
    { beerType: "Rhubarb", quantity: 0 },
    { beerType: "DNA", quantity: 0 }
  ]);
  const [notes, setNotes] = useState("");

  const totalKegs = orderItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      customerId: customerId,
      weekStartDate: new Date(weekStartDate),
      items: orderItems.filter(item => item.quantity > 0).map(item => JSON.stringify(item)),
      totalKegs,
      notes: notes.trim() || null,
    });
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: Math.max(0, quantity) } : item
    ));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create Weekly Order</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            data-testid="button-close-order-form"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="week-date">Week Starting</Label>
            <Input
              id="week-date"
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              data-testid="input-week-date"
              required
            />
          </div>

          <div>
            <Label>Order Items</Label>
            <div className="space-y-3 mt-2">
              {orderItems.map((item, index) => (
                <div key={item.beerType} className="flex items-center justify-between">
                  <span className="text-sm font-medium min-w-0 flex-1">
                    {item.beerType === "DNA" ? "Don't Need Anything" : item.beerType}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateItemQuantity(index, item.quantity - 1)}
                      disabled={item.quantity <= 0}
                      data-testid={`button-decrease-${item.beerType}`}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center text-sm" data-testid={`text-quantity-${item.beerType}`}>
                      {item.quantity}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateItemQuantity(index, item.quantity + 1)}
                      data-testid={`button-increase-${item.beerType}`}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Total: {totalKegs} keg{totalKegs !== 1 ? 's' : ''}
            </p>
          </div>

          <div>
            <Label htmlFor="order-notes">Order Notes</Label>
            <Textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions, delivery notes, etc."
              data-testid="input-order-notes"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              data-testid="button-cancel-order"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              data-testid="button-submit-order"
            >
              Create Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}