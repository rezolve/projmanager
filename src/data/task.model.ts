export class Task {
    key: string;
    proj_key: string;
    empl_key: string;
    name: string;
    description: string;
    est_hours: number;
    max_hour_day: number;
    start_date: number;
    end_date: number;
    usage_factor: number;
    milestone_key: string;
    priority: string = "Medium";
    
    constructor() {
    }

}