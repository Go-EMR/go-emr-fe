import { Component, inject } from "@angular/core";
import { LoginFormComponent } from "./ui/login-form.component";
import { LoginService } from "../shared/data-access/login.service";
import { LogoComponent } from "./ui/logo.component";

@Component({
    standalone: true,
    selector: "app-login",
    template: `
    <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
            <app-logo />
            <app-login-form (loginFormSubmitted)="loginService.postLogin($event)" />
        </div>
    </div>
    `,
    imports: [LoginFormComponent, LogoComponent],
    styles: [``]
})
// Using default for smart and routed components, not the dumb ones
export default class LoginComponent {
    loginService = inject(LoginService);
}
