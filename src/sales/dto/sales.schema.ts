

export interface SalesSchema {
    id: number;
    date: Date;
    total: number;
    branch: {
        id: string;
        name: string;
    } | null;
    cash_register: {
        id: string;
        fecha_apertura: Date;
        fecha_cierre: Date;
        estado: string;
    } | null;
    user: {
        id: string;
        name: string;
        is_active: boolean;
    } | null;
    saleDetails: {
        id: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
        productId: number;
        product_type: string;
        productName: string;
    }[]
}

export interface PaginatedSalesResponse {
    data: SalesSchema[];
    metadata: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}