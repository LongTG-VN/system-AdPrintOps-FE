import { apiClient } from '@/shared/lib/api-client';
import {
  CreateOrderRequest,
  OrderResponse,
  DesignTaskResponse,
  UploadDesignFileRequest,
  DesignFileResponse,
} from '../types/order.types';

export class OrderService {
  /**
   * Tạo đơn hàng mới từ báo giá
   * POST /api/v1/orders
   */
  static async createOrder(payload: CreateOrderRequest): Promise<OrderResponse> {
    return apiClient<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Lấy chi tiết đơn hàng theo mã (orderCode)
   * GET /api/v1/orders/code/{orderCode}
   */
  static async getOrderByCode(orderCode: string): Promise<OrderResponse> {
    return apiClient<OrderResponse>(`/orders/code/${orderCode}`);
  }

  /**
   * Lấy danh sách tất cả các đơn hàng
   * GET /api/v1/orders
   */
  static async getAllOrders(): Promise<OrderResponse[]> {
    return apiClient<OrderResponse[]>('/orders');
  }

  /**
   * Cập nhật thông tin / trạng thái đơn hàng (RUD)
   * PUT /api/v1/orders/{id}
   */
  static async updateOrder(
    id: number,
    payload: {
      status?: string;
      note?: string;
      totalAmount?: number;
      recipientName?: string;
      recipientPhone?: string;
      recipientAddress?: string;
      paidAmount?: number;
      paymentStatus?: string;
      paymentMethod?: string;
      items?: { widthCm?: number; heightCm?: number; quantity?: number }[];
    }
  ): Promise<OrderResponse> {
    return apiClient<OrderResponse>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Xóa đơn hàng (RUD)
   * DELETE /api/v1/orders/{id}
   */
  static async deleteOrder(id: number): Promise<void> {
    return apiClient<void>(`/orders/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Lấy danh sách tất cả các nhiệm vụ thiết kế
   * GET /api/v1/design-tasks
   */
  static async getAllDesignTasks(status?: string): Promise<DesignTaskResponse[]> {
    const query = status ? `?status=${status}` : '';
    return apiClient<DesignTaskResponse[]>(`/design-tasks${query}`);
  }

  /**
   * Nộp file thiết kế Corel (.cdr) dưới dạng JSON payload
   * POST /api/v1/design-tasks/{id}/files
   */
  static async uploadDesignFile(
    taskId: number,
    payload: UploadDesignFileRequest
  ): Promise<DesignFileResponse> {
    return apiClient<DesignFileResponse>(`/design-tasks/${taskId}/files`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Nộp tệp thiết kế thật từ máy tính (Multipart Upload)
   * POST /api/v1/design-tasks/{id}/upload-file
   */
  static async uploadMultipartFile(
    taskId: number,
    file: File,
    fileType: string = 'SOURCE_COREL'
  ): Promise<DesignFileResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
    const response = await fetch(`${API_BASE_URL}/design-tasks/${taskId}/upload-file`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Lỗi tải tệp: ${errText}`);
    }
    return response.json();
  }

  /**
   * Cập nhật trạng thái nhiệm vụ thiết kế
   * PUT /api/v1/design-tasks/{id}/status
   */
  static async updateDesignTaskStatus(
    taskId: number,
    status: string,
    note?: string
  ): Promise<DesignTaskResponse> {
    return apiClient<DesignTaskResponse>(`/design-tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, note, actorId: 1 }),
    });
  }
}
