import { FormulaType, SalaryComponent } from '@/types/database';

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

export function calculateOvertimePay(
  minutes: number, 
  formula: FormulaType, 
  basicSalary: number | null, 
  fixedAllowance: number | null = 0,
  flatRate: number | null,
  isHoliday: boolean = false
): { totalPay: number, formulaStr: string, multiplierTotal: number, hourlyRate: number } {
  const result = { totalPay: 0, formulaStr: '', multiplierTotal: 0, hourlyRate: 0 };
  if (minutes <= 0) return result;
  const hours = minutes / 60;
  
  if (formula === 'indonesia') {
    if (!basicSalary) return result;
    
    // Gaji Pokok + Tunjangan Tetap / 173 is the hourly rate based on Depnaker standard
    const totalWage = basicSalary + (fixedAllowance || 0);
    const hourlyRate = totalWage / 173;
    let multiplierTotal = 0;
    
    if (isHoliday) {
      // Simplified holiday calculation: 
      // First 7 hours = 2x, 8th hour = 3x, 9th+ hour = 4x
      if (hours <= 7) {
        multiplierTotal = hours * 2;
      } else if (hours <= 8) {
        multiplierTotal = (7 * 2) + ((hours - 7) * 3);
      } else {
        multiplierTotal = (7 * 2) + (1 * 3) + ((hours - 8) * 4);
      }
    } else {
      // Workday calculation: First hour = 1.5x, remaining = 2x
      if (hours <= 1) {
        multiplierTotal = hours * 1.5;
      } else {
        multiplierTotal = 1.5 + ((hours - 1) * 2);
      }
    }
    
    result.hourlyRate = hourlyRate;
    result.multiplierTotal = multiplierTotal;
    result.totalPay = hourlyRate * multiplierTotal;
    
    const formattedMultiplier = multiplierTotal % 1 === 0 ? multiplierTotal.toString() : multiplierTotal.toFixed(1);
    result.formulaStr = `(Gaji Pokok + Tunjangan Tetap) / 173 × ${formattedMultiplier}`;
    
    return result;
  }
  
  if (formula === 'flat_rate') {
    if (!flatRate) return result;
    result.hourlyRate = flatRate;
    result.multiplierTotal = hours;
    result.totalPay = hours * flatRate;
    
    const formattedHours = hours % 1 === 0 ? hours.toString() : hours.toFixed(1);
    result.formulaStr = `${formattedHours} jam × Tarif Flat`;
    
    return result;
  }
  
  // Custom formula fallback
  return result;
}
