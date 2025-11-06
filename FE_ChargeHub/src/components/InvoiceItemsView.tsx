import { useState } from "react";
import { Plus, X, Save, Send, QrCode, Clock, Timer, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Separator } from "./ui/separator";

import { toast } from "sonner";
import { Toaster } from "./ui/sonner";
import QRCodeGenerator from "./QRCodeGenerator";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  amount: number;
  total: number;
}



interface InvoiceItemsViewProps {
  onBack?: () => void;
}

export default function InvoiceItemsView({ onBack }: InvoiceItemsViewProps) {
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "1",
      description: "Charging Session - Premium Station",
      quantity: 1,
      amount: 50000,
      total: 50000
    },
    {
      id: "2", 
      description: "Service Fee",
      quantity: 1,
      amount: 10000,
      total: 10000
    }
  ]);



  const [newItem, setNewItem] = useState({
    description: "",
    quantity: 1,
    amount: 0
  });



  const [isProcessing, setIsProcessing] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const addItem = () => {
    if (newItem.description && newItem.amount > 0) {
      const item: InvoiceItem = {
        id: Date.now().toString(),
        description: newItem.description,
        quantity: newItem.quantity,
        amount: newItem.amount,
        total: newItem.quantity * newItem.amount
      };
      setItems([...items, item]);
      setNewItem({ description: "", quantity: 1, amount: 0 });
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'amount') {
          updated.total = updated.quantity * updated.amount;
        }
        return updated;
      }
      return item;
    }));
  };



  const validateItems = () => {
    const itemsValid = items.length === 0 || items.every(item => 
      item.description.trim() !== '' && 
      item.quantity > 0 && 
      item.amount > 0
    );
    return itemsValid && items.length > 0;
  };

  const handleSaveDraft = () => {
    toast.success("Invoice đã được lưu thành draft!", {
      description: `Tổng tiền: ${formatCurrency(calculateTotal())}`
    });
  };

  const handleCreateInvoice = async () => {
    if (!validateItems()) {
      toast.error("Vui lòng kiểm tra lại thông tin!", {
        description: "Tất cả items phải có đầy đủ thông tin và giá trị > 0"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate API call to create invoice
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const invoiceData = {
        id: `INV-${Date.now()}`,
        items,
        total: calculateTotal(),
        createdAt: new Date().toLocaleString('vi-VN'),
        qrCode: `chargehub://invoice/${Date.now()}`
      };

      toast.success("Invoice đã được tạo thành công!", {
        description: `Mã invoice: ${invoiceData.id}`
      });
      
      setShowQR(true);
      
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tạo invoice!", {
        description: "Vui lòng thử lại sau"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold bg-gradient-to-r from-primary to-secondary-foreground bg-clip-text text-transparent">
              Invoice Items
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your invoice items and billing details
            </p>
          </div>
          
          <Button
            onClick={addItem}
            className="bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Main Card */}
        <Card className="bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
          <CardContent className="p-6">
            {/* Add New Item Form */}
            <div className="bg-accent/20 rounded-lg p-4 mb-6 border border-border/30">
              <h3 className="font-medium mb-4 text-foreground">Add New Item</h3>
              <p className="text-sm text-muted-foreground mb-4">
                ℹ️ Penalty fees (overstay, late arrival) will be automatically calculated and added by the system.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    className="bg-input-background border-border/50"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                    className="bg-input-background border-border/50"
                    min="1"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    placeholder="Amount (VND)"
                    value={newItem.amount || ''}
                    onChange={(e) => setNewItem({...newItem, amount: parseInt(e.target.value) || 0})}
                    className="bg-input-background border-border/50"
                    min="0"
                  />
                </div>
              </div>
            </div>



            {/* Items List */}
            <div className="space-y-4">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 py-3 px-4 bg-muted/50 rounded-lg font-medium text-muted-foreground">
                <div className="col-span-4 md:col-span-5">Description</div>
                <div className="col-span-2 md:col-span-1 text-center">Qty</div>
                <div className="col-span-3 md:col-span-2 text-right">Amount</div>
                <div className="col-span-2 md:col-span-3 text-right">Total</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {/* Items */}
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 py-4 px-4 bg-background/50 rounded-lg border border-border/30 hover:border-primary/30 transition-colors">
                  <div className="col-span-4 md:col-span-5">
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="bg-transparent border-none p-0 h-auto font-medium text-foreground"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1 text-center">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="bg-transparent border-none p-0 h-auto text-center"
                      min="1"
                    />
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right">
                    <Input
                      type="number"
                      value={item.amount}
                      onChange={(e) => updateItem(item.id, 'amount', parseInt(e.target.value) || 0)}
                      className="bg-transparent border-none p-0 h-auto text-right"
                      min="0"
                    />
                  </div>
                  <div className="col-span-2 md:col-span-3 text-right font-medium text-foreground">
                    {formatCurrency(item.total)}
                  </div>
                  <div className="col-span-1 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No items added yet</p>
                  <p className="text-sm mt-2">Click "Add Item" to get started</p>
                </div>
              )}
            </div>



            {/* Total Section */}
            {items.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-primary/10 to-chart-2/10 rounded-lg p-4 border border-primary/20 min-w-[280px]">
                    <div className="text-right space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="text-2xl font-semibold bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* QR Code Display */}
            {showQR && (
              <div className="bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-lg p-6 mb-6 border border-primary/20">
                <div className="text-center">
                  <QRCodeGenerator
                    value={`chargehub://invoice/pay?amount=${calculateTotal()}&id=INV-${Date.now()}`}
                    size={200}
                    className="mb-4"
                  />
                  <h3 className="font-semibold text-lg mb-2">Invoice QR Code</h3>
                  <p className="text-muted-foreground mb-2">
                    Tổng tiền: <span className="font-medium">{formatCurrency(calculateTotal())}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Quét mã QR để thanh toán hoặc chia sẻ invoice
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQR(false)}
                      className="bg-background/50"
                    >
                      Tạo Invoice Mới
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-primary to-chart-2 hover:opacity-90"
                      onClick={() => {
                        toast.success("Đã copy link thanh toán!", {
                          description: "Link đã được sao chép vào clipboard"
                        });
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-border/30">
              <Button
                variant="outline"
                className="flex-1 bg-background/50 border-border/50 hover:bg-accent/20"
                onClick={handleSaveDraft}
                disabled={isProcessing}
              >
                <Save className="w-4 h-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-primary to-chart-2 hover:opacity-90 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!validateItems() || isProcessing}
                onClick={handleCreateInvoice}
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create & Send Invoice
                  </>
                )}
              </Button>
            </div>

            {/* Status Message */}
            {items.length > 0 && !validateItems() && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  ⚠️ Vui lòng kiểm tra lại: Tất cả items phải có đầy đủ thông tin và giá trị lớn hơn 0
                </p>
              </div>
            )}

            {items.length === 0 && (
              <div className="mt-4 p-3 bg-muted/20 border border-border/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ℹ️ Thêm ít nhất một item để tạo invoice
                </p>
              </div>
            )}

            {/* Back Button */}
            {onBack && (
              <div className="mt-6 pt-4 border-t border-border/30">
                <Button
                  variant="ghost"
                  onClick={onBack}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ← Back to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
      <Toaster />
    </>
  );
}