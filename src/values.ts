import { tfg } from "./tfg";
import { Variable } from "terraform-generator";

const values = {
  domain: `payticon.dev2.cloudticon.com`,
};

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
