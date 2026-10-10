import { describe, expect, it } from 'vitest';
import { contributionRules as rules } from '../../rules/contributions';
import { pesos } from '../../engine/money';
import { monthlyContributions, sssMonthlySalaryCredit } from '../../engine/payroll';

describe('SSS monthly salary credit', () => {
  it('rounds to the nearest ₱500 step', () => {
    expect(sssMonthlySalaryCredit(pesos('14750'), rules)).toBe(pesos('15000'));
    expect(sssMonthlySalaryCredit(pesos('15249.99'), rules)).toBe(pesos('15000'));
    expect(sssMonthlySalaryCredit(pesos('15250'), rules)).toBe(pesos('15500'));
  });
  it('is capped at ₱5,000 and ₱35,000', () => {
    expect(sssMonthlySalaryCredit(pesos('3000'), rules)).toBe(pesos('5000'));
    expect(sssMonthlySalaryCredit(pesos('80000'), rules)).toBe(pesos('35000'));
  });
});

describe('monthlyContributions', () => {
  it('₱20,000 salary: SSS 5% / 10% plus ₱30 EC', () => {
    const c = monthlyContributions(pesos('20000'), rules);
    expect(c.sss).toMatchObject({ monthlySalaryCredit: pesos('20000'), employee: pesos('1000'), employer: pesos('2000'), ec: pesos('30') });
  });
  it('EC is ₱10 below a ₱15,000 credit', () => {
    expect(monthlyContributions(pesos('10000'), rules).sss.ec).toBe(pesos('10'));
    expect(monthlyContributions(pesos('15000'), rules).sss.ec).toBe(pesos('30'));
  });
  it('PhilHealth is 5% split equally, with a ₱10,000 floor and ₱100,000 ceiling', () => {
    expect(monthlyContributions(pesos('30000'), rules).philhealth).toMatchObject({ employee: pesos('750'), employer: pesos('750') });
    expect(monthlyContributions(pesos('8000'), rules).philhealth).toMatchObject({ base: pesos('10000'), employee: pesos('250') });
    expect(monthlyContributions(pesos('150000'), rules).philhealth).toMatchObject({ base: pesos('100000'), employee: pesos('2500'), employer: pesos('2500') });
  });
  it('PhilHealth shares always add up to the premium, even when it does not split evenly', () => {
    const c = monthlyContributions(pesos('10000.10'), rules); // premium is 50001 centavos, an odd number
    expect(c.philhealth.employee + c.philhealth.employer).toBe(50001);
  });
  it('Pag-IBIG is 2% each, capped at a ₱10,000 fund salary', () => {
    expect(monthlyContributions(pesos('30000'), rules).pagibig).toMatchObject({ employee: pesos('200'), employer: pesos('200') });
    expect(monthlyContributions(pesos('8000'), rules).pagibig).toMatchObject({ employee: pesos('160'), employer: pesos('160') });
  });
  it('totals combine all three agencies', () => {
    const c = monthlyContributions(pesos('30000'), rules);
    expect(c.employeeTotal).toBe(pesos('1500') + pesos('750') + pesos('200'));
    expect(c.employerTotal).toBe(pesos('3000') + pesos('30') + pesos('750') + pesos('200'));
  });
  it('zero salary means zero contributions', () => {
    expect(monthlyContributions(0, rules).employerTotal).toBe(0);
  });
});