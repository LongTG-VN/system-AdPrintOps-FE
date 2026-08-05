export enum OrderStatus {
  PENDING = 'PENDING',
  DESIGNING = 'DESIGNING',
  WAITING_FOR_PRINT = 'WAITING_FOR_PRINT',
  PRINTING = 'PRINTING',
  WAITING_FOR_DELIVERY = 'WAITING_FOR_DELIVERY',
  COMPLETED = 'COMPLETED',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  DESIGNING: 'Thiết kế',
  WAITING_FOR_PRINT: 'Đợi in',
  PRINTING: 'Đang in',
  WAITING_FOR_DELIVERY: 'Chờ Giao',
  COMPLETED: 'Xong đơn',
};

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PARTIALLY_PAID: 'Đã cọc 1 phần',
  PAID: 'Thanh toán đủ 100%',
};

export interface CreateOrderItemRequest {
  categoryCode: string;
  productName: string;
  widthCm?: number;
  heightCm?: number;
  quantity: number;
  materialCode?: string;
  calculatedPrice: number;
  specificationsJson?: string;
}

export interface CreateOrderRequest {
  customerId?: number;
  createdBy?: number;
  totalAmount: number;
  note?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  paidAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  items: CreateOrderItemRequest[];
}

export interface OrderItemResponse {
  id: number;
  orderId: number;
  categoryCode: string;
  productName: string;
  widthCm?: number;
  heightCm?: number;
  quantity: number;
  materialCode?: string;
  calculatedPrice: number;
  specificationsJson?: string;
  createdAt: string;
}

export interface OrderResponse {
  id: number;
  orderCode: string;
  customerId?: number;
  createdBy?: number;
  totalAmount: number;
  status: string;
  note?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  paidAmount?: number;
  remainingAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface DesignFileResponse {
  id: number;
  designTaskId: number;
  versionNumber: number;
  fileType: string;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  uploadedBy?: number;
  approved: boolean;
  createdAt: string;
}

export interface DesignActivityLogResponse {
  id: number;
  designTaskId: number;
  actorId?: number;
  actionType: string;
  content: string;
  createdAt: string;
}

export interface DesignTaskResponse {
  id: number;
  taskCode: string;
  orderItemId: number;
  designerId?: number;
  status: string;
  priority: string;
  deadline?: string;
  designerNote?: string;
  customerFeedback?: string;
  files: DesignFileResponse[];
  activityLogs: DesignActivityLogResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface UploadDesignFileRequest {
  fileType: string;
  fileName: string;
  filePath: string;
  fileSizeBytes?: number;
  uploadedBy?: number;
}
