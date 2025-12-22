import { Injectable } from '@angular/core';

@Injectable()
export class QueueService {
    items: any = [];
    constructor() {
        this.items = [];
    }

    enqueue(element: any) {
        this.items.push(element); // add to end
    }

    dequeue() {
        if (this.isEmpty()) return null;
        return this.items.shift(); // remove from front
    }

    peek() {
        return this.items.length > 0 ? this.items[0] : null;
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

    clear() {
        this.items = [];
    }

} 
