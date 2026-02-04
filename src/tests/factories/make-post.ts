import { faker } from "@faker-js/faker";

export interface MakePostParams {
  message?: string;
}

export function makePost(params: MakePostParams = {}) {
  return {
    message: params.message ?? faker.lorem.sentence(),
  };
}
