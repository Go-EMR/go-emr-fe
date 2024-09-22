
import { Component, effect, inject, input } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

class ProductListDemo {
    constructor() {
    }
}

@Component({
    standalone: true,
    selector: 'app-modal',
    template: `<div></div>`,
    providers: [DialogService]
})
export class ModalComponent {

    ref: DynamicDialogRef | undefined;
    dialog = inject(DialogService);
    isOpen = input.required<boolean>();

    constructor() {
        effect(() => {
            const isOpen = this.isOpen();

            if(isOpen) {
                this.dialog.open(ProductListDemo, {
                    header: 'Select a Product',
                    width: '50vw',
                    contentStyle: { overflow: 'auto' },
                    breakpoints: {
                        '960px': '75vw',
                        '640px': '90vw'
                    },
                }
                )
            } else {
                this.ref?.close();
            }
    });
    }
    // show() {
    //     this.ref = this.dialogService.open(ProductListDemo, {
    //         header: 'Select a Product',
    //         width: '50vw',
    //         modal:true,
    //         breakpoints: {
    //             '960px': '75vw',
    //             '640px': '90vw'
    //         },
    //     });
}