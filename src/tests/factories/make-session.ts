import { faker } from "@faker-js/faker";

export interface MakeSessionParams {
  login?: string;
  password?: string;
}

export function makeSession(params: MakeSessionParams = {}) {
  return {
    login: params.login ?? faker.internet.username().toLowerCase(),
    password: params.password ?? "password123",
  };
}
