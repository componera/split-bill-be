import "reflect-metadata";
import { DataSource } from "typeorm";

// Entities
import { Restaurant } from "../modules/restaurants/entities/restaurant.entity";
import { SquareAuth } from "../modules/square/entities/square.auth.entity";
import { SquareLocation } from "../modules/square/entities/square-location.entity";
import { User } from "../modules/users/entities/user.entity";
import { InviteToken } from "../auth/entities/invite-token.entity";
import { Bill } from "../modules/bills/entities/bill.entity";
import { BillItem } from "../modules/bills/entities/bill-item.entity";
import { LightspeedToken } from "../modules/lightspeed/entities/lightspeed-token.entity";
import { Payment } from "../modules/payments/entities/payment.entity";

// Load env variables
require("dotenv").config();

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL, // Neon connection string
    ssl: { rejectUnauthorized: false }, // Neon requires SSL
    entities: [
        Restaurant,
        SquareAuth,
        SquareLocation,
        User,
        InviteToken,
        Bill,
        BillItem,
        LightspeedToken,
        Payment,
    ],
    migrations: ["src/database/migrations/*.ts"], // TypeScript migrations
    synchronize: false, // Never use synchronize: true in production
});
