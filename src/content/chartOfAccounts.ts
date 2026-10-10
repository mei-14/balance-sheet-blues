import type { Account, AccountType } from '../engine/accounts';
import { defaultNormal } from '../engine/accounts';

function a(code: string, name: string, type: AccountType, contra = false): Account {
  const base = defaultNormal(type);
  const normal = contra ? (base === 'debit' ? 'credit' : 'debit') : base;
  return contra ? { code, name, type, normal, contra } : { code, name, type, normal };
}

export const chartOfAccounts: readonly Account[] = [
  a('1010', 'Cash', 'asset'),
  a('1020', 'Accounts Receivable', 'asset'),
  a('1030', 'Inventory', 'asset'),
  a('1040', 'Prepaid Expenses', 'asset'),
  a('1050', 'Input VAT', 'asset'),
  a('1060', 'Creditable Withholding Tax', 'asset'),
  a('1210', 'Equipment', 'asset'),
  a('1220', 'Vehicles', 'asset'),
  a('1290', 'Accumulated Depreciation', 'asset', true),

  a('2010', 'Accounts Payable', 'liability'),
  a('2020', 'Output VAT Payable', 'liability'),
  a('2030', 'Percentage Tax Payable', 'liability'),
  a('2040', 'Withholding Taxes Payable', 'liability'),
  a('2050', 'SSS, PhilHealth and Pag-IBIG Payable', 'liability'),
  a('2060', '13th Month Pay Payable', 'liability'),
  a('2070', 'Income Tax Payable', 'liability'),
  a('2080', 'Payroll Liabilities', 'liability'),
  a('2100', 'Bank Loan', 'liability'),

  a('3010', "Owner's Capital", 'equity'),
  a('3020', 'Retained Earnings', 'equity'),

  a('4010', 'Sales', 'revenue'),
  a('4090', 'Other Income', 'revenue'),

  a('5010', 'Cost of Goods Sold', 'expense'),
  a('5110', 'Rent', 'expense'),
  a('5120', 'Utilities', 'expense'),
  a('5130', 'Wages', 'expense'),
  a('5140', '13th Month Pay', 'expense'),
  a('5150', 'Fuel', 'expense'),
  a('5160', 'Office Supplies', 'expense'),
  a('5170', 'Professional Fees', 'expense'),
  a('5180', 'Depreciation Expense', 'expense'),
  a('5190', 'Interest Expense', 'expense'),
  a('5200', 'Inventory Shrinkage', 'expense'),
  a('5210', 'Bank Fees', 'expense'),
  a('5220', 'Taxes and Licenses', 'expense'),
  a('5230', 'Penalties and Surcharges', 'expense'),
  a('5240', 'Legal Fees', 'expense'),
  a('5250', 'Litigation Settlements', 'expense'),
  a('5290', 'Miscellaneous', 'expense'),
];