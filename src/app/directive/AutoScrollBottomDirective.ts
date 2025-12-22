import { Directive, ElementRef, Input, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appAutoScrollBottom]'
})
export class AutoScrollBottomDirective implements AfterViewInit, OnChanges {
  @Input() appAutoScrollBottom: any[] | null = [];

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
      
    this.scrollToBottom();
  }

  ngOnChanges(changes: SimpleChanges) {
     
    if (changes['appAutoScrollBottom']) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    const element = this.el.nativeElement;
    
    setTimeout(() => {
           element.scrollTo({
      top: element.scrollHeight +200,
      behavior: 'smooth'
    });
    }, 200  );
 
  }
}
