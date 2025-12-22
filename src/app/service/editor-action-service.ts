import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EditorAction } from '../model/editor-action-model';

@Injectable({ providedIn: 'root' })
export class EditorActionService {
    /** Reactive store for all actions */
    private readonly actions$ = new BehaviorSubject<EditorAction[]>([]);

    constructor() { }

    /** Observable for UI bindings */
    get actionsObservable() {
        return this.actions$.asObservable();
    }

    /** Current snapshot */
    private get actions(): EditorAction[] {
        return this.actions$.getValue();
    }

    /** Replace all actions at once */
    setActions(newActions: EditorAction[]): void {
        this.actions$.next([...newActions]);
    }

    /** Get current actions (non-reactive) */
    getActions(): EditorAction[] {
        return this.actions;
    }

    /** Add or update a single action */
    registerAction(action: EditorAction): void {
        const existingIndex = this.actions.findIndex(a => a.id === action.id);
        const updated = [...this.actions];

        if (existingIndex !== -1) {
            // Replace existing action
            updated[existingIndex] = { ...updated[existingIndex], ...action };
        } else {
            // Add new one
            updated.push(action);
        }

        this.actions$.next(updated);
    }

    /** Remove an action by ID */
    removeAction(id: string): void {
        const updated = this.actions.filter(a => a.id !== id);
        this.actions$.next(updated);
    }

    /** Enable/disable an action */
    setEnabled(id: string, enabled: boolean): void {
        const updated = this.actions.map(a =>
            a.id === id ? { ...a, enabled } : a
        );
        this.actions$.next(updated);
    }

    /** Enable/disable after delay */
    setEnabledDelay(id: string, enabled: boolean, delay: number): void {
        setTimeout(() => this.setEnabled(id, enabled), delay);
    }

    setEnabledDelayMultiple(id: string[], enabled: boolean, delay: number): void {
        setTimeout(() => {
            id.forEach(e => {
                this.setEnabled(e, enabled)
            })
        }, delay);
    }

    /** Show/hide an action */
    setVisible(id: string, visible: boolean): void {
        const updated = this.actions.map(a =>
            a.id === id ? { ...a, visible } : a
        );
        this.actions$.next(updated);
    }

    /** Run a registered action */
    trigger(id: string): void {
        const act = this.actions.find(a => a.id === id);
        if (act?.action) {
            act.action();
        } else {
            console.warn(`Action '${id}' has no handler defined.`);
        }
    }
}
