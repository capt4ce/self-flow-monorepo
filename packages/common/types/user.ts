import { z } from "zod";

export const BaseUser = z.object({
  email: z.string().email(),
  name: z.string(),
});

export const CreateUserDTO = BaseUser.extend({});
export const UpdateUserDTO = BaseUser.extend({});

export const UserDTO = BaseUser.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});
