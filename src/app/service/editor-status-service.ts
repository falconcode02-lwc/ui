import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface EditorStatus {
    line: number;
    column: number;
    wordCount: number;
}

@Injectable({ providedIn: 'root' })
export class EditorStatusService {
    private _status = new BehaviorSubject<EditorStatus>({
        line: -1,
        column: -1,
        wordCount: -1
    });
    private _ceterMsg = new BehaviorSubject<String>('');

    status$ = this._status.asObservable();
    centerMsg$ = this._ceterMsg.asObservable();

    /** Update cursor info from the editor */
    updateStatus(status: EditorStatus) {
        this._status.next(status);
    }

    updateMsg(msg: String) {
        this._ceterMsg.next(msg);
    }

    /** Clear/reset status */
    clearStatus() {
        this._status.next({ line: -1, column: -1, wordCount: -1 });
    }
}
