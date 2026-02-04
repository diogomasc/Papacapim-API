import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userLogin: text("user_login")
    .notNull()
    .references(() => users.login, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  ip: text("ip").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
