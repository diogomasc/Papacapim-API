import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { posts } from "./posts";

export const likes = pgTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    userLogin: text("user_login")
      .notNull()
      .references(() => users.login, { onDelete: "cascade" }),
    postId: integer("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => {
    return {
      uniqueLike: unique("unique_like").on(table.userLogin, table.postId),
    };
  },
);
