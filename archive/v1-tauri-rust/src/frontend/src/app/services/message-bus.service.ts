import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface Message {
  type: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class MessageBusService {
  private bus = new Subject<Message>();

  /**
   * Publish a message to the message bus
   * @param type The message type
   * @param payload Optional payload data
   */
  publish(type: string, payload?: any): void {
    this.bus.next({ type, payload });
  }

  /**
   * Subscribe to messages of a specific type
   * @param type The message type to subscribe to
   * @returns An Observable that emits only messages of the specified type
   */
  on<T>(type: string): Observable<T> {
    return this.bus.asObservable().pipe(
      filter(message => message.type === type),
      map(message => message.payload)
    );
  }

  /**
   * Subscribe to all messages on the bus
   * @returns An Observable that emits all messages
   */
  all(): Observable<Message> {
    return this.bus.asObservable();
  }
}