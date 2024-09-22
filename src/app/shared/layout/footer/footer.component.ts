import { Component } from "@angular/core";

@Component({
    standalone: true,
    selector: "app-footer",
    template: `
    <div class="layout-footer">
    <img src="assets/app-logo/GoEMR-logo.svg" alt="Go EMR" height="20" class="mr-2"/>
    Designed with care, fueled by passion, and built with love.
    <span class="font-medium ml-2">© 2024 Go EMR Team</span>
</div>
    `,
    styles: [
        `.layout-footer {
            transition: margin-left $transitionDuration;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-top: 1rem;
            border-top: 1px solid var(--surface-border);
        }`
    ]
})
export class FooterComponent {
}