import { OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import {
  EnergyReadingDTO,
  CreateEnergyReadingDTO,
  UpdateEnergyReadingDTO,
} from "@self-flow/common/types";
import { listEnergyReadings } from "@self-flow/be-services/src/energy/listEnergyReadings";
import { createEnergyReading } from "@self-flow/be-services/src/energy/createEnergyReading";
import { updateEnergyReading } from "@self-flow/be-services/src/energy/updateEnergyReading";
import { deleteEnergyReading } from "@self-flow/be-services/src/energy/deleteEnergyReading";

const tags = ["Energy"];
export const energy = new OpenAPIHono();

function getUserId(c: any): string {
  const userId = c.get("userId");
  if (!userId) {
    throw new Error("User not authenticated");
  }
  return userId;
}

energy.openapi(
  {
    method: "get",
    path: "/",
    tags,
    request: {},
    responses: {
      200: {
        description: "List energy readings",
        content: {
          "application/json": {
            schema: z.object({ data: z.array(EnergyReadingDTO) }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    // @ts-ignore - c.env is available in Cloudflare Workers when Bindings type is set
    const data = await listEnergyReadings(userId, c.env);
    return c.json({ data });
  }
);

energy.openapi(
  {
    method: "post",
    path: "/",
    tags,
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateEnergyReadingDTO,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Create energy reading",
        content: {
          "application/json": {
            schema: z.object({ data: EnergyReadingDTO }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const body = c.req.valid("json");
    // @ts-ignore - c.env is available in Cloudflare Workers when Bindings type is set
    const data = await createEnergyReading(userId, body, c.env);
    return c.json({ data });
  }
);

energy.openapi(
  {
    method: "put",
    path: "/:id",
    tags,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          "application/json": {
            schema: UpdateEnergyReadingDTO,
          },
        },
      },
    },
    responses: {
      200: {
        description: "Update energy reading",
        content: {
          "application/json": {
            schema: z.object({ data: EnergyReadingDTO }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    // @ts-ignore - c.env is available in Cloudflare Workers when Bindings type is set
    const data = await updateEnergyReading(userId, id, body, c.env);
    return c.json({ data });
  }
);

energy.openapi(
  {
    method: "delete",
    path: "/:id",
    tags,
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        description: "Delete energy reading",
        content: {
          "application/json": {
            schema: z.object({ message: z.string() }),
          },
        },
      },
    },
  },
  async (c) => {
    const userId = getUserId(c);
    const { id } = c.req.valid("param");
    // @ts-ignore - c.env is available in Cloudflare Workers when Bindings type is set
    await deleteEnergyReading(userId, id, c.env);
    return c.json({ message: "Energy reading deleted" });
  }
);
