import { FormulaType, SalaryComponent, WorkSystem } from '@/types/database';

export function calculateTotalFixedAllowance(allowances: SalaryComponent[] | null): number {
  if (!allowances) return 0;
  return allowances.filter(a => a.is_fixed).reduce((sum, a) => sum + a.amount, 0);
}

export function calculateTotalAllowance(allowances: SalaryComponent[] | null): number {
  if (!allowances) return 0;
  return allowances.reduce((sum, a) => sum + a.amount, 0);
}

export function calculateTotalDeduction(deductions: SalaryComponent[] | null): number {
  if (!deductions) return 0;
  return deductions.reduce((sum, d) => sum + d.amount, 0);
}

export function calculateOvertimeMinutes(startTime: string, endTime: string, breakMinutes: number = 0): number {
  if (!startTime || !endTime) return 0;
  
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  let totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);

  // Handle overnight
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
  }

  return Math.max(0, totalMinutes - breakMinutes);
}

export function calculateDuration(startTime: string, endTime: string, breakMinutes: number = 0): number {
  const minutes = calculateOvertimeMinutes(startTime, endTime, breakMinutes);
  return minutes / 60;
}

export function calculateOvertimePay(
  minutes: number, 
  formula: FormulaType, 
  basicSalary: number | null, 
  fixedAllowance: number | null = 0,
  flatRate: number | null,
  isHoliday: boolean = false,
  workSystem: WorkSystem = '5_days',
  mealAllowance: number = 0,
  transportAllowance: number = 0
): { totalPay: number, formulaStr: string, multiplierTotal: number, hourlyRate: number, incentivePay: number } {
  const incentivePay = (mealAllowance || 0) + (transportAllowance || 0);
  const result = { totalPay: 0, formulaStr: '', multiplierTotal: 0, hourlyRate: 0, incentivePay };
  if (minutes <= 0) return result;
  const hours = minutes / 60;
  
  if (formula === 'indonesia') {
    if (!basicSalary) return result;
    
    // Gaji Pokok + Tunjangan Tetap / 173 is the hourly rate based on Depnaker standard (PP 35/2021)
    const totalWage = basicSalary + (fixedAllowance || 0);
    const hourlyRate = totalWage / 173;
    let multiplierTotal = 0;
    
    if (isHoliday) {
      if (workSystem === '6_days') {
        // PP 35/2021 - 6 Hari Kerja:
        // Jam 1 s.d. 7 = 2x, Jam 8 = 3x, Jam 9 s.d. 10 = 4x
        if (hours <= 7) {
          multiplierTotal = hours * 2;
        } else if (hours <= 8) {
          multiplierTotal = (7 * 2) + ((hours - 7) * 3);
        } else {
          multiplierTotal = (7 * 2) + (1 * 3) + ((hours - 8) * 4);
        }
      } else {
        // PP 35/2021 - 5 Hari Kerja:
        // Jam 1 s.d. 8 = 2x, Jam 9 = 3x, Jam 10 s.d. 12 = 4x
        if (hours <= 8) {
          multiplierTotal = hours * 2;
        } else if (hours <= 9) {
          multiplierTotal = (8 * 2) + ((hours - 8) * 3);
        } else {
          multiplierTotal = (8 * 2) + (1 * 3) + ((hours - 9) * 4);
        }
      }
    } else {
      // Workday calculation (PP 35/2021): First hour = 1.5x, remaining = 2x
      if (hours <= 1) {
        multiplierTotal = hours * 1.5;
      } else {
        multiplierTotal = 1.5 + ((hours - 1) * 2);
      }
    }
    
    result.hourlyRate = hourlyRate;
    result.multiplierTotal = multiplierTotal;
    result.totalPay = (hourlyRate * multiplierTotal) + incentivePay;
    
    const formattedMultiplier = multiplierTotal % 1 === 0 ? multiplierTotal.toString() : multiplierTotal.toFixed(1);
    result.formulaStr = `(Gaji Pokok + Tunjangan Tetap) / 173 × ${formattedMultiplier}${incentivePay > 0 ? ` + Insentif` : ''}`;
    
    return result;
  }
  
  if (formula === 'flat_rate') {
    if (!flatRate) return result;
    result.hourlyRate = flatRate;
    result.multiplierTotal = hours;
    result.totalPay = (hours * flatRate) + incentivePay;
    
    const formattedHours = hours % 1 === 0 ? hours.toString() : hours.toFixed(1);
    result.formulaStr = `${formattedHours} jam × Tarif Flat${incentivePay > 0 ? ` + Insentif` : ''}`;
    
    return result;
  }
  
  // Custom formula fallback
  result.totalPay += incentivePay;
  return result;
}
