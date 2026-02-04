import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userLogin: text("user_login")
    .notNull()
    .references(() => users.login, { onDelete: "cascade" }),
  postId: integer("post_id").references((): any => posts.id, {
    onDelete: "cascade",
  }),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
