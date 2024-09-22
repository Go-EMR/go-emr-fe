import { Component, inject } from "@angular/core";
import { FormsModule } from '@angular/forms';
import { DOCUMENT } from '@angular/common';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CalendarModule } from 'primeng/calendar';

@Component({
    standalone: true,
    selector: "app-header",
    imports: [FormsModule, InputSwitchModule, CalendarModule],
    template: `
    <div class="layout-topbar">
    <a class="layout-topbar-logo" routerLink="">
    <img src="assets/app-logo/GoEMR-logo.svg" alt="logo">
        <span>Go EMR</span>
    </a>

    <button #menubutton class="p-link layout-menu-button layout-topbar-button">
        <i class="pi pi-bars"></i>
    </button>

    <button #topbarmenubutton class="p-link layout-topbar-menu-button layout-topbar-button">
        <i class="pi pi-ellipsis-v"></i>
    </button>

    <div #topbarmenu class="layout-topbar-menu">
        <span>@if (isDarkMode) {
      Dark 🌚
    } @else {
      Light 🌞
    }
</span>
        <button class="p-link layout-topbar-button" (click)="toggleLightDark()">
        @if (isDarkMode) {
            <i class="pi pi-moon"></i>
            <span>Dark 🌚</span>
      
    } @else {
        <i class="pi pi-sun"></i>
        <span>Light 🌞</span>
    }
            
        </button>
        <div class="card flex justify-content-center">
        <p-calendar 
        [(ngModel)]="date" 
        [iconDisplay]="'input'" 
        [showButtonBar]="true"
        [showWeek]="true"
        [startWeekFromFirstDayOfYear]="true"
        [showIcon]="true"
        inputId="icondisplay"/>
        </div>
        <button class="p-link layout-topbar-button">
  <i class="pi pi-user"></i>
            <span>Profile</span> 
  
        </button>
        
        <button class="p-link layout-topbar-button">
            <i class="pi pi-cog"></i>
            <span>Settings</span>
        </button>
    </div>
</div>
    `,
    styles: [
        `.layout-topbar {
            position: fixed;
            height: 5rem;
            z-index: 997;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 2rem;
            background-color: var(--surface-card);
            transition: left $transitionDuration;
            display: flex;
            align-items: center;
            box-shadow: 0px 3px 5px rgba(0,0,0,.02), 0px 0px 2px rgba(0,0,0,.05), 0px 1px 4px rgba(0,0,0,.08);
        
            .layout-topbar-logo {
                display: flex;
                align-items: center;
                color: var(--surface-900);
                font-size: 1.5rem;
                font-weight: 500;
                width: 300px;
                border-radius: 12px;
        
                img {
                    height: 2.5rem;
                    margin-right: .5rem;
                }
        
                &:focus {
                    @include focused();
                }
            }
        
            .layout-topbar-button {
                display: inline-flex;
                justify-content: center;
                align-items: center;
                position: relative;
                color: var(--text-color-secondary);
                border-radius: 50%;
                width: 3rem;
                height: 3rem;
                cursor: pointer;
                transition: background-color $transitionDuration;
        
                &:hover {
                    color: var(--text-color);
                    background-color: var(--surface-hover);
                }
        
                &:focus {
                    @include focused();
                }
        
                i {
                    font-size: 1.5rem;
                }
        
                span {
                    font-size: 1rem;
                    display: none;
                }
            }
        
            .layout-menu-button {
                margin-left: 2rem;
            }
        
            .layout-topbar-menu-button {
                display: none;
        
                i {
                    font-size: 1.25rem;
                }
            }
        
            .layout-topbar-menu {
                margin: 0 0 0 auto;
                padding: 0;
                list-style: none;
                display: flex;
        
                .layout-topbar-button {
                    margin-left: 1rem;
                }
            }
        }
        
        @media (max-width: 991px) {
            .layout-topbar {
                justify-content: space-between;
        
                .layout-topbar-logo {
                    width: auto;
                    order: 2;
                }
        
                .layout-menu-button {
                    margin-left: 0;
                    order: 1;
                }
        
                .layout-topbar-menu-button {
                    display: inline-flex;
                    margin-left: 0;
                    order: 3;
                }
        
                .layout-topbar-menu {
                    margin-left: 0;
                    position: absolute;
                    flex-direction: column;
                    background-color: var(--surface-overlay);
                    box-shadow: 0px 3px 5px rgba(0,0,0,.02), 0px 0px 2px rgba(0,0,0,.05), 0px 1px 4px rgba(0,0,0,.08);
                    border-radius: 12px;
                    padding: 1rem;
                    right: 2rem;
                    top: 5rem;
                    min-width: 15rem;
                    display: none;
                    -webkit-animation: scalein 0.15s linear;
                    animation: scalein 0.15s linear;
        
                    &.layout-topbar-menu-mobile-active {
                        display: block
                    }
        
                    .layout-topbar-button {
                        margin-left: 0;
                        display: flex;
                        width: 100%;
                        height: auto;
                        justify-content: flex-start;
                        border-radius: 12px;
                        padding: 1rem;
        
                        i {
                            font-size: 1rem;
                            margin-right: .5rem;
                        }
        
                        span {
                            font-weight: medium;
                            display: block;
                        }
                    }
                }
            }
        }`
    ]
})
export class HeaderComponent {
    date: Date[] | undefined;
    constructor() {
        if(this.isSystemDark()) {
            this.toggleLightDark();
          }
        }
        isSystemDark(): boolean {
            return window?.matchMedia?.('(prefers-color-scheme:dark)')?.matches;
          }
        
          #document = inject(DOCUMENT)
          isDarkMode = false;
          toggleLightDark() {
            const linkElement = this.#document.getElementById('app-theme') as HTMLLinkElement;
            if (linkElement.href.includes('light')) {
              linkElement.href = 'theme-dark.css';
              this.isDarkMode = true;
            } else {
              linkElement.href = 'theme-light.css';
              this.isDarkMode = false;
            }
          }
}