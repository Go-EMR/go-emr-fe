import { Component, inject, output } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Login } from "../../shared/interfaces/login";

@Component({
    standalone: true,
    selector: "app-login-form",
    template: `
<div style="border-radius:56px; padding:0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%);">
    <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius:53px">
        <div class="text-center mb-5">
            <img src="assets/demo/images/login/avatar.png" alt="Image" height="50" class="mb-3">
            <div class="text-900 text-3xl font-medium mb-3">Welcome, Isabel!</div>
            <span class="text-600 font-medium">Sign in to continue</span>
        </div>

        <div>
            <form [formGroup]="loginForm" (ngSubmit)="loginFormSubmitted.emit(loginForm.getRawValue())" class="login-form">
                <label for="email1" class="block text-900 text-xl font-medium mb-2">Email</label>
                <input id="email1" type="text" formControlName="username" placeholder="Username" pInputText class="w-full md:w-30rem mb-5" style="padding:1rem">

                <label for="password1" class="block text-900 font-medium text-xl mb-2">Password</label>
                <input type="password" formControlName="password" placeholder="Password" styleClass="mb-5" inputStyleClass="w-full p-3 md:w-30rem">

                <div class="flex align-items-center justify-content-between mb-5 gap-5">
                    <div class="flex align-items-center">
                        <input type="checkbox" formControlName="rememberMe" styleClass="mr-2">
                        <label for="rememberme1">Remember me</label>
                    </div>
                    <a class="font-medium no-underline ml-2 text-right cursor-pointer" style="color: var(--primary-color)">Forgot password?</a>
                </div>
                <button [disabled]="!loginForm.valid" type="submit" pButton pRipple label="Sign In" class="w-full p-3 text-xl">Login</button>
            </form>
            <p class="signup-text">Don't have an account? <a href="#">Sign Up</a></p>
        </div>
    `,
    imports: [ReactiveFormsModule],
    styles: []
})
export class LoginFormComponent {
    private fb = inject(FormBuilder);
    loginFormSubmitted = output<Login>();

    loginForm = this.fb.nonNullable.group({
        username: ["", Validators.required],
        password: ["", Validators.required],
        rememberMe: [false],
    });
}
