import { tfg } from "./tfg";
import { Variable } from "terraform-generator";

const values = {};

export const variables: Record<string, Variable> = {};
Object.entries(values).forEach(([name, value]) => {
  variables[name] = tfg.variable(
    name,
    {
      type: "string",
    },
    value
  );
});
