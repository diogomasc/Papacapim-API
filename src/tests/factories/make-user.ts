import { faker } from "@faker-js/faker";

export interface MakeUserParams {
  login?: string;
  name?: string;
  password?: string;
}

export function makeUser(params: MakeUserParams = {}) {
  return {
    login: params.login ?? faker.internet.username().toLowerCase(),
    name: params.name ?? faker.person.fullName(),
    password: params.password ?? "password123",
    password_confirmation: params.password ?? "password123",
  };
}
