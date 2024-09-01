import { Component } from "@angular/core";

@Component({
    standalone: true,
    selector: "app-logo",
    template: `
    <img src="assets/app-logo/GoEMR-logo.svg" alt="Go EMR logo" class="mb-5 w-6rem flex-shrink-0">
    `,
    styles: []
})
export class LogoComponent {}