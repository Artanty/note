import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class UserService {
    public getUser(): number {
        return 1
    }
    public getCloseCountdown(): number {
        return 5
    }
}