export type ProductId = string;

export type ProductCategory =
	| 'laptop'
	| 'phone'
	| 'tablet'
	| 'monitor'
	| 'accessory';

export interface Product {
	readonly id: ProductId;
	readonly name: string;
	readonly description: string;
	readonly category: ProductCategory;
	readonly stockQuantity: number;
	readonly createdAt: Date;
}