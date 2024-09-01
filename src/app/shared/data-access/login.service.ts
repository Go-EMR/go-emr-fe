import { Injectable, signal } from "@angular/core";
import { Login } from "../interfaces/login";

@Injectable({
    providedIn: "root"
})
export class LoginService {
    postLogin(login: Login) {
        console.log("Inside login service", login);
    }
}