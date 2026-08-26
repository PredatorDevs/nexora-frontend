import { describe, expect, it } from 'vitest';

import { productFormInitialValues } from '@/modules/products/product-form-values.js';

describe('productFormInitialValues', () => {
  it('converts the serialized decimal factor to a number for InputNumber', () => {
    const values = productFormInitialValues({
      id: 9,
      name: 'Producto',
      purchaseToSaleFactor: '1.000000',
      productCategory: { parent: { id: 3 } },
    });

    expect(values.purchaseToSaleFactor).toBe(1);
    expect(typeof values.purchaseToSaleFactor).toBe('number');
    expect(values.categoryId).toBe(3);
  });
});
