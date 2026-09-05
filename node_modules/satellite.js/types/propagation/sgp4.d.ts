import { PositionAndVelocity } from '../common-types.js';
import { SatRec } from './SatRec.js';
export default function sgp4(satrec: SatRec, tsince: number): PositionAndVelocity | null;
