import { PositionAndVelocity } from '../common-types.js';
import { SatRec } from './SatRec.js';
export declare function propagate(satrec: SatRec, date: Date): PositionAndVelocity;
export declare function propagate(satrec: SatRec, year: number, month: number, day: number, hour: number, minute: number, second: number, ms?: number): PositionAndVelocity;
export default function propagate(satrec: SatRec, ...jdayArgs: [Date] | [number, number, number, number, number, number, (number | undefined)?]): PositionAndVelocity | null;
