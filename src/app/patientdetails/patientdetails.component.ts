import { Component } from "@angular/core";
import { PatientDetailsOrgComponent } from "./ui/patientdetails-org.component";
import { CardModule } from 'primeng/card';

@Component({
    standalone: true,
    selector: "app-patientdetails",
    template: `
    <div class="grid">
        <div class="col-12 xl:col-12">
            <p-card header="Patient profile">
                <p class="m-0">
                    <app-patientdetails-org></app-patientdetails-org>
                </p>
            </p-card>
        </div>
    </div>
    `,
    imports: [PatientDetailsOrgComponent, CardModule]
})
export  default class PatientDetailsComponent {
    constructor() {
        console.log("PatientDetailsComponent constructor");
    }
}
