export function productFormInitialValues(product) {
  if (!product) return { purchaseToSaleFactor: 1 };
  return {
    ...product,
    categoryId: product.productCategory?.parent?.id,
    purchaseToSaleFactor: Number(product.purchaseToSaleFactor),
  };
}
