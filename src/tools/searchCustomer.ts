import { loadCustomers, type Customer } from "../data.js";

export interface SearchCustomerParams {
  customer_id?: string;
  age_group?: string;
}

/**
 * Mock tool: looks up customers in the demo dataset.
 * Production equivalent queries the store's customer table.
 */
export function searchCustomer(params: SearchCustomerParams = {}): Customer[] {
  const { customer_id, age_group } = params;
  return loadCustomers().filter((c) => {
    if (customer_id && c.customer_id !== customer_id) return false;
    if (age_group && c.age_group !== age_group) return false;
    return true;
  });
}
