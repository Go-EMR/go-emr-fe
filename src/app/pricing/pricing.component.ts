import { Component } from "@angular/core";
import { PricingPlansComponent } from "./ui/pricing-plans.component";

@Component({
    selector: 'app-pricing',
    standalone: true,
    imports: [PricingPlansComponent],
    template: `
    <app-pricing-plans></app-pricing-plans>
    `
})
export default class PricingComponent {}
