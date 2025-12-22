import { Component, OnInit } from '@angular/core';
import { EditorStatusService } from '../service/editor-status-service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-footer',
    templateUrl: 'footer.component.html'
})

export class FooterComponent implements OnInit {

    centerMsg: String = '';
     private subCenterMsg?: Subscription;
    constructor(private editorStatus: EditorStatusService) {


        this.subCenterMsg = this.editorStatus.centerMsg$.subscribe((msg) => (
            this.centerMsg = msg
        ));

    }

    ngOnInit() { }
}