import { Injectable, OnApplicationBootstrap } from "@nestjs/common";
import { BitgetService } from "./bitget/bitget.service";
import { UserService } from "../user/user.service";
import { User } from "src/model/User";
import { BitgetWsService } from "./bitget/bitget-ws/bitget-ws.service";


@Injectable()
export class PlateformsService {
    constructor(private bitgetService: BitgetService, private bitgetWsService: BitgetWsService) {}

    async initializeTraders(users: User[]) {
        await this.bitgetService.initializeTraders(users);
        await this.bitgetWsService.initializeTraders(users);
    }
    
    addNewTrader(user: User) {
        this.bitgetService.addNewTrader(user);
        this.bitgetWsService.addNewTrader(user);
    }
}