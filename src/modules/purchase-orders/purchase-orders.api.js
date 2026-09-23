import { apiClient } from '@/api/api-client.js';
export async function listPurchaseOrders(params){const response=await apiClient.get('/purchase-orders',{params});return{purchaseOrders:response.data,pagination:response.meta.pagination};}
export async function getPurchaseOrder(id){return(await apiClient.get(`/purchase-orders/${id}`)).data;}
export async function generatePurchaseOrders(data){return(await apiClient.post('/purchase-orders/generate',data)).data;}
export async function transitionPurchaseOrder(item,action,reason){return(await apiClient.post(`/purchase-orders/${item.id}/${action}`,{expectedUpdatedAt:item.updatedAt,...(reason?{reason}:{})})).data;}
