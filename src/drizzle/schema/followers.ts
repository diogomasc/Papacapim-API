import {
  pgTable,
  serial,
  text,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  followerLogin: text("follower_login")
    .notNull()
    .references(() => users.login, { onDelete: "cascade" }),
  followedLogin: text("followed_login")
    .notNull()
    .references(() => users.login, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
