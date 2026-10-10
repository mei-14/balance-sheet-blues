import type { ContributionRules } from '../rules/contributions';
import type { Centavos } from './money';
import { mulBps } from './money';

export interface ShareSplit {
  employee: Centavos;
  employer: Centavos;
}

export interface Contributions {
  sss: ShareSplit & { monthlySalaryCredit: Centavos; ec: Centavos };
  philhealth: ShareSplit & { base: Centavos };
  pagibig: ShareSplit & { base: Centavos };
  employeeTotal: Centavos;
  /** Includes the SSS Employees' Compensation amount. */
  employerTotal: Centavos;
}

/** Salary rounded to the nearest credit step (half up), kept within the min and max credit. */
export function sssMonthlySalaryCredit(monthlyBasic: Centavos, rules: ContributionRules): Centavos {
  const r = rules.sss;
  const rounded = Math.floor((monthlyBasic + r.mscStep / 2) / r.mscStep) * r.mscStep;
  return Math.min(r.maxMonthlySalaryCredit, Math.max(r.minMonthlySalaryCredit, rounded));
}

export function monthlyContributions(monthlyBasic: Centavos, rules: ContributionRules): Contributions {
  if (monthlyBasic <= 0) {
    return {
      sss: { monthlySalaryCredit: 0, employee: 0, employer: 0, ec: 0 },
      philhealth: { base: 0, employee: 0, employer: 0 },
      pagibig: { base: 0, employee: 0, employer: 0 },
      employeeTotal: 0,
      employerTotal: 0,
    };
  }

  const s = rules.sss;
  const msc = sssMonthlySalaryCredit(monthlyBasic, rules);
  const sss = {
    monthlySalaryCredit: msc,
    employee: mulBps(msc, s.employeeRateBps),
    employer: mulBps(msc, s.employerRateBps),
    ec: msc >= s.ecThresholdMsc ? s.ecAtOrAboveThreshold : s.ecBelowThreshold,
  };

  const p = rules.philhealth;
  const phBase = Math.min(p.salaryCeiling, Math.max(p.salaryFloor, monthlyBasic));
  const premium = mulBps(phBase, p.premiumRateBps);
  const phEmployee = mulBps(premium, 5000);
  const philhealth = { base: phBase, employee: phEmployee, employer: premium - phEmployee };

  const g = rules.pagibig;
  const piBase = Math.min(g.maxFundSalary, monthlyBasic);
  const pagibig = {
    base: piBase,
    employee: mulBps(piBase, g.employeeRateBps),
    employer: mulBps(piBase, g.employerRateBps),
  };

  return {
    sss,
    philhealth,
    pagibig,
    employeeTotal: sss.employee + philhealth.employee + pagibig.employee,
    employerTotal: sss.employer + sss.ec + philhealth.employer + pagibig.employer,
  };
}