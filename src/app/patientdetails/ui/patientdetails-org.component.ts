import { Component } from "@angular/core";
import { TreeNode } from 'primeng/api';
import { OrganizationChartModule } from 'primeng/organizationchart';

@Component({
    standalone: true,
    selector: "app-patientdetails-org",
    imports: [OrganizationChartModule],
    template: `
        <p-organizationChart 
        [value]="data" 
        selectionMode="multiple" 
        [(selection)]="selectedNodes" 
        [collapsible]="true">
            <ng-template let-node pTemplate="person">
                <div class="p-2 text-center">
                    <img 
                        [src]="node.data.image" 
                        class="mb-3 w-3rem h-3rem" />
                    <div class="font-bold">
                        {{ node.data.name }}
                    </div>
                    <div>
                        {{ node.data.title }}
                    </div>
                </div>
            </ng-template>
    </p-organizationChart>
    `
})

export class PatientDetailsOrgComponent {
    selectedNodes!: TreeNode[];
    data: TreeNode[] = [
        {
            expanded: true,
            type: 'person',
            data: {
                image: 'assets/avatars/default/persons/user.png',
                name: 'My',
                title: 'Owner'
            },
            children: [
                {
                    expanded: true,
                    type: 'person',
                    data: {
                        image: 'assets/avatars/default/pets/dog/dog-1.svg',
                        name: '',
                        title: 'Dog'
                    },
                },
            ]
        }
    ];
    constructor() {
        console.log("PatientDetailsOrgComponent constructor");
    }
}
