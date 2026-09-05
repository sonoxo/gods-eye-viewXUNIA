import { GMSTime } from '../common-types.js';
declare function gstime(jd: number): GMSTime;
declare function gstime(date: Date): GMSTime;
declare function gstime(year: number, month: number, day: number, hour: number, minute: number, second: number, millisecond?: number): GMSTime;
export default gstime;
