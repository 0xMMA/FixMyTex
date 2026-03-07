import { Injectable } from '@angular/core';
import { WailsService } from './wails.service';

@Injectable({ providedIn: 'root' })
export class LogService {
  constructor(private readonly wails: WailsService) {}
  info(msg: string): void  { void this.wails.log('info',  msg); }
  debug(msg: string): void { void this.wails.log('debug', msg); }
  warn(msg: string): void  { void this.wails.log('warn',  msg); }
  error(msg: string): void { void this.wails.log('error', msg); }
}
