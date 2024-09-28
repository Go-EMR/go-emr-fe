import { Component, signal } from "@angular/core";
import { StyleClassModule } from 'primeng/styleclass';
import { CardModule } from 'primeng/card';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common'; // Add this line


@Component({
    standalone: true,
    selector: "app-home",
    imports: [StyleClassModule, BreadcrumbModule, RouterModule, CommonModule, CardModule],
    template: `
    <div class="card flex justify-content-left" style="margin-bottom: 15px;">
        <p-breadcrumb class="max-w-full" [model]="items">
            <ng-template pTemplate="item" let-item>
                <ng-container *ngIf="item.route; else elseBlock">
                    <a [routerLink]="item.route" class="p-menuitem-link">
                        <span [ngClass]="[item.icon ? item.icon : '', 'text-color']"></span>
                        <span class="text-primary font-semibold">{{ item.label }}</span>
                    </a>
                </ng-container>
                <ng-template #elseBlock>
                    <a [href]="item.url">
                        <span class="text-color">{{ item.label }}</span>
                    </a>
                </ng-template>
            </ng-template>
        </p-breadcrumb>
    </div>

    <div class="grid">
        <div class="col-12 xl:col-12">
            <p-card class="card" title="Card 1">
                <p>Welcome back, {{user()}}!</p>
            </p-card>
        </div>
        <div class="col-12 lg:col-6 xl:col-3">
            <p-card class="card" title="Card 1">
                <p>Mini Card 1 Content</p>
            </p-card>
        </div>
        <div class="col-12 lg:col-6 xl:col-3">
            <p-card class="card" title="Card 1">
                <p>Mini Card 2 Content</p>
            </p-card>
        </div>
        <div class="col-12 lg:col-6 xl:col-3">
            <p-card class="card" title="Card 1">
                <p>Mini Card 3 Content</p>
            </p-card>
        </div>
        <div class="col-12 lg:col-6 xl:col-3">
            <p-card class="card" title="Card 1">
                <p>Mini Card 4 Content</p>
            </p-card>
        </div>
    </div>
    `
})
// Using default for smart and routed components, not the dumb ones
export default class HomeComponent {
    user = signal<string>("Anonymous");
    items: any[] = [];

    home: any;
    constructor() {}
    ngOnInit() {
        this.items = [{ icon: 'pi pi-home', route: '/installation' }, { label: 'Components' }, { label: 'Form' }, { label: 'InputText', route: '/inputtext' }];
    }
}
